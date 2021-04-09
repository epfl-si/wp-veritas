import SimpleSchema from "simpl-schema";
import { Sites, professorSchema, tagSchema } from "../collections";
import { sitesSchema } from "../schemas/sitesSchema";
import { sitesWPInfraOutsideSchema } from "../schemas/sitesWPInfraOutsideSchema";
import { throwMeteorError, throwMeteorErrors } from "../error";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin, Editor } from "./role";
import { Telegram } from "../telegram";
import { getEnvironment } from "../../api/utils";

import "../methods"; // without this line run test failed

const generateAnsibleHostPattern = (site) => {
  const currentURL = new URL(site.url);
  let result = currentURL.host.replace(".epfl.ch", "");

  // Delete the first '/'
  let pathName = currentURL.pathname.slice(1);

  // Delete the last '/'
  pathName = pathName.slice(0, pathName.length - 1);

  // Replace all '/' by '__'
  pathName = pathName.replace(/\//g, "__");

  if (pathName) {
    result += "__" + pathName;
  }

  // Replace all '-' by '_'
  result = result.replace(/-/g, "_");

  return result;
};

function getUnitNames(unitId) {
  // Ldap search to get unitName and unitLevel2
  let unit = Meteor.apply("getUnitFromLDAP", [unitId], true);
  let unitName = "";
  let unitNameLevel2 = "";

  if (unit && "cn" in unit) {
    unitName = unit.cn;
  }

  if (unit && "dn" in unit) {
    let dn = unit.dn.split(",");
    if (dn.length == 5) {
      // dn[2] = 'ou=associations'
      unitNameLevel2 = dn[2].split("=")[1];
    }
  }

  return {
    unitName: unitName,
    unitNameLevel2: unitNameLevel2,
  };
}

function prepareUpdateInsert(site, action) {
  if (site.userExperienceUniqueLabel == undefined) {
    site.userExperienceUniqueLabel = "";
  }

  // Ensures that site URL will end with a slash
  if (!site.url.endsWith("/")) {
    site.url += "/";
  }

  const URL_ALREADY_EXISTS_MSG =
    "Cette URL existe déjà ! (il peut s'agir d'un site présent dans la corbeille).";
  const LABEL_ALREADY_EXISTS_MSG = "Ce label existe déjà !";

  // Check if url is unique and if userExperienceUniqueLabel is unique
  // TODO: Move this code to SimpleSchema custom validation function
  if (action === "update") {
    let sites = Sites.find({ url: site.url });
    if (sites.count() > 1) {
      throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
    } else if (sites.count() == 1) {
      if (sites.fetch()[0]._id != site._id) {
        throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
      }
    }
    if (site.userExperienceUniqueLabel != "") {
      let sitesByUXUniqueLabel = Sites.find({
        userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      });
      if (sitesByUXUniqueLabel.count() > 1) {
        throwMeteorError("userExperienceUniqueLabel", LABEL_ALREADY_EXISTS_MSG);
      } else if (sitesByUXUniqueLabel.count() == 1) {
        if (sitesByUXUniqueLabel.fetch()[0]._id != site._id) {
          throwMeteorError("userExperienceUniqueLabel", LABEL_ALREADY_EXISTS_MSG);
        }
      }
    }
  } else {
    if (Sites.find({ url: site.url }).count() > 0) {
      throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
    }

    if (
      site.userExperienceUniqueLabel != "" &&
      Sites.find({
        userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      }).count() > 0
    ) {
      throwMeteorError("userExperienceUniqueLabel", LABEL_ALREADY_EXISTS_MSG);
    }
  }

  if (site.tags == undefined) {
    site.tags = [];
  }

  if (site.userExperience == undefined) {
    site.userExperience = false;
  }

  return site;
}

const validateConsistencyOfFields = (newSite) => {
  // For "int" openshiftEnv, we want test all cases
  if (newSite.openshiftEnv !== "int") {
    // Check if inside site datas are OK
    if (
      newSite.url.includes("inside.epfl.ch") ||
      newSite.openshiftEnv === "inside" ||
      newSite.categories.find((category) => category.name === "Inside")
    ) {
      if (
        !(
          newSite.url.includes("inside.epfl.ch") &&
          newSite.openshiftEnv === "inside" &&
          newSite.categories.find((category) => category.name === "Inside")
        )
      ) {
        throwMeteorErrors(
          ["url", "categories", "openshiftEnv"],
          "Site inside: Les champs url, catégorie et environnement OpenShift ne sont pas cohérents"
        );
      }
    }

    // Check if subdomains-lite site datas are OK
    if (
      newSite.openshiftEnv === "subdomains-lite" ||
      newSite.openshiftEnv.startsWith("unm-") ||
      newSite.theme === "wp-theme-light"
    ) {
      if (
        !(
          (newSite.openshiftEnv === "subdomains-lite" || newSite.openshiftEnv.startsWith("unm-")) &&
          newSite.theme === "wp-theme-light"
        )
      ) {
        throwMeteorErrors(
          ["theme", "openshiftEnv"],
          "Site subdomains-lite: Les champs thème et environnement OpenShift ne sont pas cohérents"
        );
      }
    }
  }
};

const insertSite = new VeritasValidatedMethod({
  name: "insertSite",
  role: Admin,
  validate(newSite) {
    // TODO: Default values should not be subject to data validation.
    newSite.isDeleted = false;
    if (newSite.wpInfra) {
      sitesSchema.validate(newSite);
    } else {
      sitesWPInfraOutsideSchema.validate(newSite);
    }
    validateConsistencyOfFields(newSite);
  },
  run(newSite) {
    newSite = prepareUpdateInsert(newSite, "insert");

    let unitName, unitNameLevel2;
    // TODO: Find a more elegant way to mock this for Travis CI
    if (process.env.TRAVIS) {
      unitName = "idev-fsd";
      unitNameLevel2 = "si";
    } else {
      unitName = getUnitNames(newSite.unitId).unitName;
      unitNameLevel2 = getUnitNames(newSite.unitId).unitNameLevel2;
    }

    let newSiteDocument = {
      url: newSite.url,
      tagline: newSite.tagline,
      title: newSite.title,
      openshiftEnv: newSite.openshiftEnv,
      categories: newSite.categories,
      theme: newSite.theme,
      languages: newSite.languages,
      unitId: newSite.unitId,
      unitName: unitName,
      unitNameLevel2: unitNameLevel2,
      snowNumber: newSite.snowNumber,
      comment: newSite.comment,
      createdDate: new Date(),
      userExperience: newSite.userExperience,
      userExperienceUniqueLabel: newSite.userExperienceUniqueLabel,
      tags: newSite.tags,
      professors: newSite.professors,
      wpInfra: newSite.wpInfra,
      isDeleted: newSite.isDeleted,
    };

    let newSiteId = Sites.insert(newSiteDocument);
    let newSiteAfterInsert = Sites.findOne({ _id: newSiteId });

    AppLogger.getLog().info(
      `Insert site ID ${newSiteId}`,
      { before: "", after: newSiteAfterInsert },
      this.userId
    );

    if (newSite.wpInfra) {
      const user = Meteor.users.findOne({ _id: this.userId });
      const message =
        "👀 Pssst! " +
        user.username +
        " (#" +
        this.userId +
        ") has just created " +
        newSite.url +
        " on wp-veritas! #wpSiteCreated";
      Telegram.sendMessage(message);
    }

    return newSiteAfterInsert;
  },
});

const updateSite = new VeritasValidatedMethod({
  name: "updateSite",
  role: Admin,
  validate(newSite) {
    // TODO: Ajouter un champ professors: [] à tous les sites qui n'ont pas de prof
    if (!("professors" in newSite)) {
      newSite.professors = [];
    }

    if (newSite.wpInfra) {
      sitesSchema.validate(newSite);
    } else {
      sitesWPInfraOutsideSchema.validate(newSite);
    }

    validateConsistencyOfFields(newSite);
  },
  run(newSite) {
    newSite = prepareUpdateInsert(newSite, "update");

    let unitName, unitNameLevel2;
    // TODO: Find a more elegant way to mock this for Travis CI
    if (process.env.TRAVIS) {
      unitName = "idev-fsd";
      unitNameLevel2 = "si";
    } else {
      unitName = getUnitNames(newSite.unitId).unitName;
      unitNameLevel2 = getUnitNames(newSite.unitId).unitNameLevel2;
    }

    let newSiteDocument = {
      url: newSite.url,
      tagline: newSite.tagline,
      title: newSite.title,
      openshiftEnv: newSite.openshiftEnv,
      categories: newSite.categories,
      theme: newSite.theme,
      languages: newSite.languages,
      unitId: newSite.unitId,
      unitName: unitName,
      unitNameLevel2: unitNameLevel2,
      snowNumber: newSite.snowNumber,
      comment: newSite.comment,
      createdDate: newSite.createdDate,
      userExperience: newSite.userExperience,
      userExperienceUniqueLabel: newSite.userExperienceUniqueLabel,
      tags: newSite.tags,
      professors: newSite.professors,
      wpInfra: newSite.wpInfra,
      isDeleted: newSite.isDeleted,
    };

    let siteBeforeUpdate = Sites.findOne({ _id: newSite._id });

    Sites.update({ _id: newSite._id }, { $set: newSiteDocument });

    let updatedSite = Sites.findOne({ _id: newSite._id });

    AppLogger.getLog().info(
      `Update site ID ${newSite._id}`,
      { before: siteBeforeUpdate, after: updatedSite },
      this.userId
    );

    return updatedSite;
  },
});

async function delay(ms) {
  // return await for better async stack trace support in case of errors.
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

const generateSite = new VeritasValidatedMethod({
  name: "generateSite",
  role: Admin,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),

  async run({ siteId }) {
    let job_id = "";
    let status = "";

    if (Meteor.isServer) {
      let site = Sites.findOne({ _id: siteId });

      if (!site.wpInfra) {
        return false;
      }

      ansibleHost = generateAnsibleHostPattern(site);

      if (ansibleHost === "") {
        return false;
      }

      if (
        (getEnvironment() === "DEV" && site.url.includes("canari")) ||
        getEnvironment() === "PROD"
      ) {
        const AWX_URL = "https://awx-wwp.epfl.ch/api/v2/job_templates/32/launch/";
        const WP_VERITAS_AWX_TOKEN = process.env.WP_VERITAS_AWX_TOKEN;

        let options = {
          headers: {
            Authorization: `Bearer ${WP_VERITAS_AWX_TOKEN}`,
            "Content-Type": "application/json",
          },
          data: {
            limit: ansibleHost,
          },
        };

        // Run AWX Job
        let callResponse = HTTP.call("POST", AWX_URL, options);
        job_id = callResponse.data.job;

        // GET the status every 10 secondes
        let continueAgain = true;
        let index = 1;
        while (continueAgain) {
          await delay(10000);
          response = HTTP.call("GET", "https://awx-wwp.epfl.ch/api/v2/jobs/" + job_id, options);
          status = response.data.status;
          if (status == "successful" || status == "failed" || index > 150) {
            continueAgain = false;
          }
          index += 1;
        }

        AppLogger.getLog().info(
          `Generate site ID ${siteId}`,
          { before: site, after: site },
          this.userId
        );

        if (site.wpInfra) {
          const user = Meteor.users.findOne({ _id: this.userId });
          let message =
            "⚠️ Heads up! " +
            user.username +
            " (#" +
            this.userId +
            ") has just normalized " +
            site.url +
            " on wp-veritas! #wpSiteNormalized";
          if (site.openshiftEnv === "subdomains-lite") {
            message += "\n Don't forget to change the varnish configuration!";
          }
          Telegram.sendMessage(message);
        }
      }
    }
    return status;
  },
});

const removeSite = new VeritasValidatedMethod({
  name: "removeSite",
  role: Admin,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  run({ siteId }) {
    let site = Sites.findOne({ _id: siteId });
    Sites.update({ _id: siteId }, { $set: { isDeleted: true } });
    AppLogger.getLog().info(`Delete site ID ${siteId}`, { before: site, after: "" }, this.userId);

    if (site.wpInfra) {
      const user = Meteor.users.findOne({ _id: this.userId });
      const message =
        "⚠️ Heads up! " +
        user.username +
        " (#" +
        this.userId +
        ") has just deleted " +
        site.url +
        " on wp-veritas! #wpSiteDeleted";
      Telegram.sendMessage(message);
    }
  },
});

const removePermanentlySite = new VeritasValidatedMethod({
  name: "removePermanentlySite",
  role: Admin,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  run({ siteId }) {
    let site = Sites.findOne({ _id: siteId });
    Sites.remove({ _id: siteId });
    AppLogger.getLog().info(
      `Delete permanently site ID ${siteId}`,
      { before: site, after: "" },
      this.userId
    );
  },
});

const restoreSite = new VeritasValidatedMethod({
  name: "restoreSite",
  role: Admin,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  run({ siteId }) {
    let site = Sites.findOne({ _id: siteId });
    Sites.update({ _id: siteId }, { $set: { isDeleted: false } });
    AppLogger.getLog().info(`Restore site ID ${siteId}`, { before: site, after: "" }, this.userId);

    if (site.wpInfra) {
      const user = Meteor.users.findOne({ _id: this.userId });
      const message =
        "⚠️ Heads up! " +
        user.username +
        " (#" +
        this.userId +
        ") has just restored " +
        site.url +
        " on wp-veritas! #wpSiteRestored";
      Telegram.sendMessage(message);
    }
  },
});

const associateProfessorsToSite = new VeritasValidatedMethod({
  name: "associateProfessorsToSite",
  role: Editor,
  validate({ site, professors }) {
    if (Array.isArray(professors)) {
      professors.forEach((prof) => {
        professorSchema.validate(prof);
      });
    } else {
      throwMeteorError("professors", "Professors data are BAD");
    }

    if (site.wpInfra) {
      sitesSchema.validate(site);
    } else {
      sitesWPInfraOutsideSchema.validate(site);
    }
  },
  run({ site, professors }) {
    let siteDocument = {
      professors: professors,
    };

    let siteBeforeUpdate = Sites.findOne({ _id: site._id });
    Sites.update({ _id: site._id }, { $set: siteDocument });

    let updatedSite = Sites.findOne({ _id: site._id });

    AppLogger.getLog().info(
      `Associate professors to site with ID ${site._id}`,
      { before: siteBeforeUpdate, after: updatedSite },
      this.userId
    );
  },
});

const associateTagsToSite = new VeritasValidatedMethod({
  name: "associateTagsToSite",
  role: Editor,
  validate({ site, tags }) {
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        tagSchema.validate(tag);
      });
    } else {
      throwMeteorError("tags", "Tags data are BAD");
    }

    if (site.wpInfra) {
      sitesSchema.validate(site);
    } else {
      sitesWPInfraOutsideSchema.validate(site);
    }
  },
  run({ site, tags }) {
    let siteDocument = {
      tags: tags,
    };

    let siteBeforeUpdate = Sites.findOne({ _id: site._id });

    Sites.update({ _id: site._id }, { $set: siteDocument });

    let updatedSite = Sites.findOne({ _id: site._id });

    AppLogger.getLog().info(
      `Associate tags to site with ID ${site._id}`,
      { before: siteBeforeUpdate, after: updatedSite },
      this.userId
    );
  },
});

rateLimiter([
  insertSite,
  updateSite,
  removeSite,
  removePermanentlySite,
  restoreSite,
  associateProfessorsToSite,
  associateTagsToSite,
  generateSite,
]);

export {
  insertSite,
  updateSite,
  removeSite,
  removePermanentlySite,
  restoreSite,
  associateProfessorsToSite,
  associateTagsToSite,
  generateSite,
};
