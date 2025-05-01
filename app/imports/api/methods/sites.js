import SimpleSchema from "simpl-schema";
import { Sites, SitesExternal, Tags, Types, tagSchema } from "../collections";
import { throwMeteorError, throwMeteorErrors } from "../error";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin, Editor } from "./role";
import { Telegram } from "../telegram";
import { getEnvironment } from "../../api/utils";
import Debug from "debug";

import "../methods"; // without this line run test failed
import { siteWPSchema } from "../schemas/siteWPSchema";
import { siteExternalSchema } from "../schemas/siteExternal";
import { siteWPKubernetesSchema } from "../schemas/siteWPKubernetesSchema";

const debug = Debug("api/methods/sites");

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

  // Ensures that site URL will end with a slash
  if (!site.url.endsWith("/")) {
    site.url += "/";
  }

  const URL_ALREADY_EXISTS_MSG =
    "Cette URL existe déjà ! (il peut s'agir d'un site présent dans la corbeille).";

  // Check if URL is unique
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
  } else {
    if (await Sites.find({ url: site.url }).countAsync() > 0) {
      throwMeteorError("url", URL_ALREADY_EXISTS_MSG);
    }
  }

  if (site.tags == undefined) {
    site.tags = [];
  }

  if (site.monitorSite == undefined) {
    site.monitorSite = false;
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
          "Site inside: Les champs URL et catégorie ne sont pas cohérents"
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

    if (newSite.url.includes(".epfl.ch") && !newSite.url.includes("wpn-test.epfl.ch")) {
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

    if (type.schema === "internal") {
      siteWPSchema.validate(newSite);
    } else if (type.schema === "external") {
      siteExternalSchema.validate(newSite);
    } else {
      throwMeteorError("type", "Type de site inconnu");
    }

    validateConsistencyOfFields(newSite);
  },
  async run(newSite) {
    const type = await Types.findOneAsync({
      name: newSite.type,
      schema: { $ne: null }
    })

    if (!type) {
      throwMeteorError("type", "Type de site inconnu");
    }

    if (type.schema === "internal") {
      import { createWPSite } from "/server/kubernetes.js";
      const { url } = await createWPSite(newSite);
      return {
        name: url,
        unitName: "TODO"
      };
    } else if (type.schema === "external") {
      newSite.createdDate = new Date().toISOString().split('T')[0];
      await Sites.insertAsync(newSite);
      return {
        url: newSite.url,
        unitName: "TODO"
      };
    }
  }
});

const updateSite = new VeritasValidatedMethod({
  name: "updateSite",
  role: Admin,
  validate(newSite) {
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

const removeSite = new VeritasValidatedMethod({
  name: "removeSite",
  role: Admin,
  serverOnly: true,
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  async run({ siteId }) {
    let site = await Sites.findOneAsync({ _id: siteId });
    if (!site) {
      throwMeteorError("site", "Site not found");
    }

    const type = await Types.findOneAsync({
      name: newSite.type,
      schema: { $ne: null }
    })

    if (!type) {
      throwMeteorError("type", "Type de site inconnu");
    }

    if (type.schema === "internal") {
      import { deleteWPSite } from "/server/kubernetes.js";
      await deleteWPSite(site.k8sName);
    } else if (type.schema === "external") {
      await Sites.removeAsync({ _id: siteId });
    }

    AppLogger.getLog().info(`Delete site ID ${siteId}`, { before: site, after: "" }, this.userId);

    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const message = `⚠️ Heads up! [${user.username}](https://people.epfl.ch/${this.userId}) deleted ${site.url} (${site.type}) on wp-veritas! #wpSiteDeleted`;

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

const associateTagsToSite = new VeritasValidatedMethod({
  name: "associateTagsToSite",
  role: Editor,
  async validate({ site, tags }) {
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        tagSchema.validate(tag);
      });
    } else {
      throwMeteorError("tags", "Tags data are BAD");
    }

    const type = await Types.findOneAsync({
      name: site.type,
      schema: { $ne: null }
    })

    if (!type) {
      throwMeteorError("type", "Type de site inconnu");
    }

    if (type.schema === "internal") {
      siteWPKubernetesSchema.validate(site);
    } else if (type.schema === "external") {
      siteExternalSchema.validate(site);
    } else {
      throwMeteorError("type", "Type de site inconnu");
    }
  },
  async run({ site, tags }) {
    const allTags = await Tags.find().fetchAsync();
    for (const existingTag of allTags) {
      const tagStillSelected = tags.some(selectedTag => selectedTag._id === existingTag._id);
      if (existingTag.sites && existingTag.sites.includes(site.url)) {
        if (!tagStillSelected) {
          await Tags.updateAsync(
            { _id: existingTag._id },
            { $pull: { sites: site.url } }
          );
        }
      }

      else if (tagStillSelected) {
        await Tags.updateAsync(
          { _id: existingTag._id },
          { $addToSet: { sites: site.url } }
        );
      }
    }

    const siteBeforeUpdate = await Sites.findOneAsync({ _id: site._id });
    const tagsAfterUpdate = await Tags.find({ sites: site.url }).fetchAsync();

    AppLogger.getLog().info(
      `Associate tags to site with ID ${site._id}`,
      {
        before: siteBeforeUpdate,
        after: {
          _id: site._id,
          url: site.url,
          associatedTags: tagsAfterUpdate.map(tag => ({ _id: tag._id, name: tag.name_fr, type: tag.type }))
        }
      },
      this.userId
    );
  },
});

const getDaysFromDate = (date) => {
  const fromDate = new Date(date);
  const today = new Date();
  const diffInMs = today - fromDate;
  const diffInDay = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return (diffInDay > 0) ? ( (diffInDay == 1) ? 'Today' : `${diffInDay} days` ) : '-';
}

rateLimiter([
  insertSite,
  updateSite,
  removeSite,
  removePermanentlySite,
  restoreSite,
  associateTagsToSite,
]);

export {
  insertSite,
  updateSite,
  removeSite,
  removePermanentlySite,
  restoreSite,
  associateTagsToSite,
  getDaysFromDate,
};
