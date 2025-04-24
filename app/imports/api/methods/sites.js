import SimpleSchema from "simpl-schema";
import { Sites, Types, professorSchema, tagSchema } from "../collections";
import { sitesSchema } from "../schemas/sitesSchema";
import { sitesWPInfraOutsideSchema } from "../schemas/sitesWPInfraOutsideSchema";
import { throwMeteorError, throwMeteorErrors } from "../error";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin, Editor } from "./role";
import { Telegram } from "../telegram";
import { getEnvironment } from "../../api/utils";
import Debug from "debug";

import "../methods"; // without this line run test failed
import { siteWPSchema } from "../schemas/siteWPSchema";
import { siteExternal } from "../schemas/siteExternal";

const debug = Debug("api/methods/sites");

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

  if (getEnvironment() === "TEST") {
    result = `test_${result}`;
  }

  return result;
};

async function getUnitNames(unitId) {
  // Ldap search to get unitName and unitLevel2
  let unit = await Meteor.applyAsync("getUnitFromLDAP", [unitId], true);
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

async function prepareUpdateInsert(site, action) {
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
    const sites = Sites.find({ url: site.url });
    const sitesCount = await sites.countAsync();
    if (sitesCount > 1) {
      throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
    } else if (sitesCount == 1) {
      if ((await sites.fetchAsync())[0]._id != site._id) {
        throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
      }
    }
    if (site.userExperienceUniqueLabel != "") {
      const sitesByUXUniqueLabel = Sites.find({
        userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      });
      const sitesByUXUniqueLabelCount = await sitesByUXUniqueLabel.countAsync();
      if (sitesByUXUniqueLabelCount > 1) {
        throwMeteorError("userExperienceUniqueLabel", LABEL_ALREADY_EXISTS_MSG);
      } else if (sitesByUXUniqueLabelCount == 1) {
        if ((await sitesByUXUniqueLabel.fetch())[0]._id != site._id) {
          throwMeteorError("userExperienceUniqueLabel", LABEL_ALREADY_EXISTS_MSG);
        }
      }
    }
  } else {
    if (await Sites.find({ url: site.url }).countAsync() > 0) {
      throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
    }

    if (
      site.userExperienceUniqueLabel != "" &&
      (await Sites.find({
        userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      }).countAsync ()) > 0
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
  if (newSite.type === "kubernetes") {
    if (
      newSite.url.includes("inside.epfl.ch") ||
      newSite.categories.find((category) => category.name === "Inside")
    ) {
      if (
        !(
          newSite.url.includes("inside.epfl.ch") &&
          newSite.categories.find((category) => category.name === "Inside")
        )
      ) {
        throwMeteorErrors(
          ["url", "categories"],
          "Site inside: Les champs url et catégorie ne sont pas cohérents"
        );
      }
    }

    if (newSite.url.includes("www.epfl.ch")) {
      if (newSite.categories.find((category) => category.name === "epfl-menus")) {
        throwMeteorErrors(
          ["categories"],
          "Sites www: La catégorie epfl-menus est obligatoire"
        );
      }
    }

    if (newSite.url.includes(".epfl.ch")) {
      if (!(newSite.theme === "wp-theme-light")) {
        throwMeteorErrors(
          ["theme"],
          "Site subdomains-lite: Le champ du thème n'est pas cohérent"
        );
      }
    }
  }
};

const insertSite = new VeritasValidatedMethod({
  name: "insertSite",
  role: Admin,
  serverOnly: true,
  async validate(newSite) {
    const type = await Types.findOneAsync({
      name: newSite.type,
      schema: { $ne: null }
    })

    if (!type) {
      throwMeteorError("type", "Type de site inconnu");
    }

    if (type.schema === "siteWPSchema"){
      siteWPSchema.validate(newSite);
    } else if (type.schema === "siteExternal") {
      siteExternal.validate(newSite);
    } else {
      throwMeteorError("type", "Type de site inconnu");
    }

    validateConsistencyOfFields(newSite);
  },
  async run(newSite) {
    import { createWPSite } from "/server/kubernetes.js";
    const { k8sName } = await createWPSite(newSite);
    return {
      k8sName,
      unitName: "TODO"
    };
  }
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
  async run(newSite) {
    return createWPSite(newSite);
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
    debug(`generateSite(siteId = ${siteId})`);
    let job_id = "";
    let status = "";

    if (! Meteor.isServer) return;

    let site = await Sites.findOneAsync({ _id: siteId });

    if (!site.wpInfra) {
      debug('generateSite(): !site.wpInfra');
      return false;
    }

    const ansibleHost = generateAnsibleHostPattern(site);

    if (ansibleHost === "") {
      debug('generateSite(): ansibleHost === ""');
      return false;
    }

    const AWX_URL = process.env.WP_VERITAS_AWX_URL;
    const WP_VERITAS_AWX_TOKEN = process.env.WP_VERITAS_AWX_TOKEN;

    const headers = {
      Authorization: `Bearer ${WP_VERITAS_AWX_TOKEN}`,
      "Content-Type": "application/json",
    };

    // Run AWX Job
    let callResponse = await fetch(AWX_URL, {
      method: "POST",
      body: JSON.stringify({
        limit: ansibleHost
      }),
      headers
    });
    if (callResponse.status !== 200 && callResponse.status !== 201) {
      throw new Error(`${AWX_URL}: code ${callResponse.status} — ${await callResponse.text()}`);
    }
    const callData = await callResponse.json();
    debug(`callResponse: ${JSON.stringify(callData)}`);

    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    let defaultMsgNormalization = `⚠️ Heads up! [${user.username}](https://people.epfl.ch/${this.userId}) has just launched a normalization for ${site.url} on wp-veritas!\nPlease head to https://awx-wwp.epfl.ch/#/jobs/playbook/${callData.job} for details.`;
    Telegram.sendMessage(defaultMsgNormalization, /*preview=*/false, /*notification=*/false);

    // GET the status every 10 secondes

    for(let i = 1; i < 150 /* which works out to 25 minutes */; i++) {
      await delay(10 * 1000);
      const pollUrl = "https://awx-wwp.epfl.ch/api/v2/jobs/" + job_id;
      const pollResponse = await fetch(pollUrl, { method: "GET", headers });
      if (pollResponse.status !== 200) {
        throw new Error(`${pollUrl}: code ${pollResponse.status} — ${await pollResponse.text()}`);
      }
      const pollData = await pollResponse.json();
      if (pollData.status == "successful" || pollData.status == "failed") {
        break;
      }
    }

    AppLogger.getLog().info(
      `Generate site ID ${siteId}`,
      { before: site, after: site },
      this.userId
    );

    // TODO: it would be nice to add the duration in the message.
    let statusMsgNormalization = `The normalization for the site ${site.url} on wp-veritas`;
    if (status == "successful") {
      statusMsgNormalization = `🤘 ${statusMsgNormalization} was successful #wpSiteNormalized`;
      if (site.openshiftEnv === "subdomains-lite") {
        statusMsgNormalization += "\n⚠️ Don't forget to change the varnish configuration!";
      }
    } else {
      statusMsgNormalization = `❌ ${statusMsgNormalization} failed`;
    }
    Telegram.sendMessage(statusMsgNormalization);


    debug(`generateSite(): status is ${status}`);
    return status;
  },
});

const removeSite = new VeritasValidatedMethod({
  name: "removeSite",
  role: Admin,
  serverOnly: true,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  async run({ siteId }) {
    import { deleteWPSite } from "/server/kubernetes.js";

    let site = await Sites.findOneAsync({ _id: siteId });
    await deleteWPSite(site.k8sName);
    AppLogger.getLog().info(`Delete site ID ${siteId}`, { before: site, after: "" }, this.userId);

    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const message = `⚠️ Heads up! [${user.username}](https://people.epfl.ch/${this.userId}) deleted ${site.url} on wp-veritas! #wpSiteDeleted`;
    Telegram.sendMessage(message, /*preview=*/false);
  },
});

const removePermanentlySite = new VeritasValidatedMethod({
  name: "removePermanentlySite",
  role: Admin,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  async run({ siteId }) {
    let site = await Sites.findOneAsync({ _id: siteId });
    await Sites.removeAsync({ _id: siteId });
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
  async run({ siteId }) {
    let site = await Sites.findOneAsync({ _id: siteId });
    await Sites.updateAsync({ _id: siteId }, { $set: { isDeleted: false } });
    AppLogger.getLog().info(`Restore site ID ${siteId}`, { before: site, after: "" }, this.userId);

    if (site.wpInfra) {
      const user = await Meteor.users.findOneAsync({ _id: this.userId });
      const message = `⚠️ Heads up! [${user.username}](https://people.epfl.ch/${this.userId}) restored ${site.url} on wp-veritas! #wpSiteRestored`;
      Telegram.sendMessage(message, /*preview=*/false);
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
  async run({ site, professors }) {
    let siteDocument = {
      professors: professors,
    };

    let siteBeforeUpdate = await Sites.findOneAsync({ _id: site._id });
    await Sites.updateAsync({ _id: site._id }, { $set: siteDocument });

    let updatedSite = await Sites.findOneAsync({ _id: site._id });

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
  async run({ site, tags }) {
    let siteDocument = {
      tags: tags,
    };

    let siteBeforeUpdate = await Sites.findOneAsync({ _id: site._id });

    await Sites.updateAsync({ _id: site._id }, { $set: siteDocument });

    let updatedSite = await Sites.findOneAsync({ _id: site._id });

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
