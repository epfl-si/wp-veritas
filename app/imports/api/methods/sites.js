import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";
import { Sites, professorSchema, tagSchema } from "../collections";
import { sitesSchema } from "../schemas/sitesSchema";
import { sitesWPInfraOutsideSchema } from "../schemas/sitesWPInfraOutsideSchema";
import { throwMeteorError } from "../error";
import { checkUserAndRole } from "./utils";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";

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

  // Delete "/" at the end of URL
  let url = site.url;
  if (url.endsWith("/")) {
    site.url = url.slice(0, -1);
  }

  // Check if url is unique and if userExperienceUniqueLabel is unique
  // TODO: Move this code to SimpleSchema custom validation function
  if (action === "update") {
    let sites = Sites.find({ url: site.url });
    if (sites.count() > 1) {
      throwMeteorError("url", "Cette URL existe déjà !");
    } else if (sites.count() == 1) {
      if (sites.fetch()[0]._id != site._id) {
        throwMeteorError("url", "Cette URL existe déjà !");
      }
    }
    if (site.userExperienceUniqueLabel != "") {
      let sitesByUXUniqueLabel = Sites.find({
        userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      });
      if (sitesByUXUniqueLabel.count() > 1) {
        throwMeteorError("userExperienceUniqueLabel", "Ce label existe déjà !");
      } else if (sitesByUXUniqueLabel.count() == 1) {
        if (sitesByUXUniqueLabel.fetch()[0]._id != site._id) {
          throwMeteorError(
            "userExperienceUniqueLabel",
            "Ce label existe déjà !"
          );
        }
      }
    }
  } else {
    if (Sites.find({ url: site.url }).count() > 0) {
      throwMeteorError("url", "Cette URL existe déjà !");
    }

    if (
      site.userExperienceUniqueLabel != "" &&
      Sites.find({
        userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      }).count() > 0
    ) {
      throwMeteorError("userExperienceUniqueLabel", "Ce label existe déjà !");
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

const insertSite = new ValidatedMethod({
  name: "insertSite",
  validate(newSite) {
    if (newSite.wpInfra) {
      sitesSchema.validate(newSite);
    } else {
      sitesWPInfraOutsideSchema.validate(newSite);
    }
  },
  run(newSite) {
    checkUserAndRole(this.userId, ["admin"], "Only admins can insert sites.");

    newSite = prepareUpdateInsert(newSite, "insert");

    const { unitName, unitNameLevel2 } = getUnitNames(newSite.unitId);

    let newSiteDocument = {
      url: newSite.url,
      tagline: newSite.tagline,
      title: newSite.title,
      openshiftEnv: newSite.openshiftEnv,
      category: newSite.category,
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
    };

    let newSiteId = Sites.insert(newSiteDocument);
    let newSiteAfterInsert = Sites.findOne({ _id: newSiteId });

    AppLogger.getLog().info(
      `Insert site ID ${newSiteId}`,
      { before: "", after: newSiteAfterInsert },
      this.userId
    );

    return newSite;
  },
});

const updateSite = new ValidatedMethod({
  name: "updateSite",
  validate(newSite) {
    if (newSite.wpInfra) {
      sitesSchema.validate(newSite);
    } else {
      sitesWPInfraOutsideSchema.validate(newSite);
    }
  },
  run(newSite) {
    checkUserAndRole(this.userId, ["admin"], "Only admins can update sites.");

    if (!("professors" in newSite)) {
      newSite.professors = [];
    }

    newSite = prepareUpdateInsert(newSite, "update");

    const { unitName, unitNameLevel2 } = getUnitNames(newSite.unitId);

    let newSiteDocument = {
      url: newSite.url,
      tagline: newSite.tagline,
      title: newSite.title,
      openshiftEnv: newSite.openshiftEnv,
      category: newSite.category,
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

const removeSite = new ValidatedMethod({
  name: "removeSite",
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  run({ siteId }) {
    checkUserAndRole(this.userId, ["admin"], "Only admins can remove sites.");

    let site = Sites.findOne({ _id: siteId });
    Sites.remove({ _id: siteId });

    AppLogger.getLog().info(
      `Delete site ID ${siteId}`,
      { before: site, after: "" },
      this.userId
    );
  },
});

const associateProfessorsToSite = new ValidatedMethod({
  name: "associateProfessorsToSite",
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
    checkUserAndRole(
      this.userId,
      ["admin", "tags-editor"],
      "Only admins and editors can associate professors to a site."
    );

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

const associateTagsToSite = new ValidatedMethod({
  name: "associateTagsToSite",
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
    checkUserAndRole(
      this.userId,
      ["admin", "tags-editor"],
      "Only admins and editors can associate tags to a site."
    );

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
  associateProfessorsToSite,
  associateTagsToSite,
]);

export {
  insertSite,
  updateSite,
  removeSite,
  associateProfessorsToSite,
  associateTagsToSite,
};
