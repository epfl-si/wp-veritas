const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const mv = promisify(fs.rename);
const config = require("./config.js");
const dbHelpers = require("./db-helper.js");

/**
 * Deleting the dump/ directory
 */
module.exports.deleteDumpFolder = async function () {
  await new Promise(function (resolve, reject) {
    let command = `rm ${config.WORKSPACE_PATH}/dump/ -rf`;
    resolve(exec(command));
  });
};

/**
 * Move wp-veritas/dump/wp-veritas/ to wp-veritas/dump/meteor/
 */
module.exports.moveDumpFolder = async (dbName) => {
  const source = `${config.WORKSPACE_PATH}/dump/wp-veritas/`;
  const target = `${config.WORKSPACE_PATH}/dump/${dbName}/`;
  await mv(source, target);
};

/**
 * Parse JSON File and return JSON data
 */
module.exports.parseData = () => {
  var myjson = JSON.parse(
    fs.readFileSync(
      config.WORKSPACE_PATH + "/app/private/inventory-test.json",
      "utf8"
    )
  );
  return myjson;
};

/**
 * Load sites data
 */
module.exports.loadData = async (destination, data) => {
  let sites = data["_meta"]["hostvars"];
  try {
    Object.values(sites).forEach(async (currentSite) => {
      let stop = false;
      if (
        currentSite.wp_hostname !== "migration-wp.epfl.ch" ||
        currentSite.wp_env !== "int"
      ) {
        stop = true;
      }
      let url, title, categories, categoryName, theme, languages;
      if (!stop) {
        url = `https://${currentSite.wp_hostname}/${currentSite.wp_path}`;
        title = currentSite.wp_path;
        categoryName = currentSite["wp_details"]["options"]["epfl:site_category"];       
        if (categoryName == null) {
          categoryName = "GeneralPublic";
        }

        // Get category object by category name
        let connectionString = dbHelpers.getConnectionString(destination);

        // Return a empty list if category is GeneralPublic
        categories = await dbHelpers.getCategory(
          connectionString,
          destination,
          categoryName
        );

        theme = currentSite["wp_details"]["options"]["stylesheet"];
        languages = currentSite["wp_details"]["polylang"]["langs"];

        if (!languages) {
          stop = true;
        }
      }
      if (!stop) {
        let unitId =
          currentSite["wp_details"]["options"]["plugin:epfl_accred:unit_id"];
        let unitName =
          currentSite["wp_details"]["options"]["plugin:epfl_accred:unit"];

        let siteDocument = {
          url: url,
          tagline: "",
          title: title,
          wpInfra: true,
          openshiftEnv: "int",
          categories: categories,
          theme: theme,
          languages: languages,
          unitId: unitId,
          unitName: unitName,
          unitNameLevel2: "",
          snowNumber: "",
          comment: "",
          userExperience: false,
          slug: "",
          professors: [],
          tags: [],
        };

        let connectionString = dbHelpers.getConnectionString(destination);

        await dbHelpers.insertOneSite(
          connectionString,
          destination,
          siteDocument
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
};
