import SimpleSchema from "simpl-schema";
import { Site, Sites, SitesExternal, Tags, Types, tagSchema } from "../collections";
import { throwMeteorError, throwMeteorErrors } from "../error";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin, Editor } from "./role";
import { Telegram } from "../telegram";
import { getEnvironment } from "../../api/utils";
import Debug from "debug";

import { siteWPSchema } from "../schemas/siteWPSchema";
import { siteExternalSchema } from "../schemas/siteExternal";
import { siteWPKubernetesSchema } from "../schemas/siteWPKubernetesSchema";

const debug = Debug("api/methods/sites");

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

async function validateSite(site) {
  site = new Site(site);

  const type = await Types.findOneAsync({
      name: site.type,
    schema: { $ne: null }
  })

  if (!type) {
    throwMeteorError("type", "Type de site inconnu");
  }

  if (type.schema === "internal") {
    siteWPSchema.validate(site);
  } else if (type.schema === "external") {
    siteExternalSchema.validate(site);
  } else {
    throwMeteorError("type", "Type de site inconnu");
  }

  if (site.type === "kubernetes") {
    if (
      site.url.includes("inside.epfl.ch") ||
      site.categories.find((category) => category === "Inside")
    ) {
      if (
        !(
          site.url.includes("inside.epfl.ch") &&
          site.categories.find((category) => category === "Inside")
        )
      ) {
        throwMeteorErrors(
          ["url", "categories"],
          "Site inside: Les champs URL et catégorie ne sont pas cohérents"
        );
      }
    }

    if (site.url.includes("www.epfl.ch")) {
      if (! site.categories.find((category) => category === "epfl-menus")) {
        throwMeteorErrors(
          ["categories"],
          "Sites www: La catégorie epfl-menus est obligatoire"
        );
      }
    }

    if (! site.isThemeAllowed(site.theme)) {
      throwMeteorErrors(
        ["theme"],
        `Le thème ${site.theme} n'est pas permis pour le domaine ${URL.parse(site.url).hostname}`
      );
    }
  }
};

const insertSite = new VeritasValidatedMethod({
  name: "insertSite",
  role: Admin,
  serverOnly: true,
  async validate(newSite) {
    await validateSite(newSite);
  },
  async run(newSite) {
    const type = await Types.findOneAsync({
      name: newSite.type,
      schema: { $ne: null }
    })

    if (!type) {
      throwMeteorError("type", "Type de site inconnu");
    }

    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const message = `👀 Pssst! [${user.username}](https://people.epfl.ch/${this.userId}) created ${newSite.url} on wp-veritas! #wpSiteCreated`;
    Telegram.sendMessage(message, /*preview=*/false);

    try {
      if (type.schema === "internal") {
        import { createWPSite } from "/server/kubernetes.js";
        const { statusCode, message, url } = await createWPSite(newSite);
        return {
          statusCode, 
          message, 
          url
        };
      } else if (type.schema === "external") {
        newSite.createdDate = new Date().toISOString().split('T')[0];
        await Sites.insertAsync(newSite);
        return {
          statusCode: 201,
          message: "Site created successfully",
          url: newSite.url
        };
      }
    } catch (err) {
      throw err;
    }
  }
});

const updateSite = new VeritasValidatedMethod({
  name: "updateSite",
  role: Admin,
  async validate(siteToUpdate) {
    await validateSite(siteToUpdate);
  },
  async run(siteToUpdate) {
    const type = await Types.findOneAsync({
      name: siteToUpdate.type,
      schema: { $ne: null }
    })

    if (!type) {
      throwMeteorError("type", "Type de site inconnu");
    }

    if (type.schema === "internal") {
      // TODO: Update for Kubernetes
    } else if (type.schema === "external") {
      const site = await Sites.findOneAsync({ url: siteToUpdate.url });
      delete siteToUpdate._id;
      const siteUpdated = await Sites.updateAsync({ _id: site._id }, { $set: siteToUpdate });
    }
  },
});
const setMonitor = new VeritasValidatedMethod({
  name: "setMonitor",
  role: Admin,
  serverOnly: true,
  validate: new SimpleSchema({
    url: { type: String },
    status: { type: Boolean },
  }).validator(),
  async run ({ url, status }) {
    const site = await Sites.ensureExists(url);
    await Sites.updateAsync({ url }, { $set: { monitorSite: status } });
  }
});

const removeSite = new VeritasValidatedMethod({
  name: "removeSite",
  role: Admin,
  serverOnly: true,
  validate: new SimpleSchema({
    url: { type: String },
  }).validator(),
  async run({ url }) {
    import { deleteWPSiteByURL } from "/server/kubernetes.js";
    await deleteWPSiteByURL(url);
    // TODO: do we want to set the `isDeleted` flag here instead?
    await Sites.removeAsync({ url });
    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const message = `⚠️ Heads up! [${user.username}](https://people.epfl.ch/${this.userId}) deleted ${url} on wp-veritas! #wpSiteDeleted`;
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
  serverOnly: true,
  async validate({ url, tags }) {
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        tagSchema.validate(tag);
      });
    } else {
      throwMeteorError("tags", "Tags data are BAD");
    }
  },
  async run({ url, tags }) {
    const allTags = await Tags.find().fetchAsync();
    for (const existingTag of allTags) {
      const tagStillSelected = tags.some(selectedTag => selectedTag._id === existingTag._id);
      if (existingTag.sites && existingTag.sites.includes(url)) {
        if (!tagStillSelected) {
          await Tags.updateAsync(
            { _id: existingTag._id },
            { $pull: { sites: url } }
          );
        }
      }

      else if (tagStillSelected) {
        await Tags.updateAsync(
          { _id: existingTag._id },
          { $addToSet: { sites: url } }
        );
      }
    }

    const tagsAfterUpdate = await Tags.find({ sites: url }).fetchAsync();

    AppLogger.getLog().info(
      `Associate tags to site with URL ${url}`,
      {
        after: {
          url: url,
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
  fromDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffInMs = today - fromDate;
  const diffInDay = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDay === 0) return 'Today';
  if (diffInDay > 0) return `${diffInDay} days`;
  return '-';
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
