import { Sites } from "../api/collections";
import { AppLogger } from "../api/logger";

Meteor.methods({
  async getUserFromLDAP(sciper) {
    let result;
    const publicLdapContext = require("epfl-ldap")();
    result = await new Promise(function (resolve, reject) {
      publicLdapContext.users.getUserBySciper(sciper, function (err, data) {
        resolve(data);
      });
    });
    return result;
  },

  async getUnitFromLDAP(uniqueIdentifier) {
    let result;
    const publicLdapContext = require("epfl-ldap")();
    result = await new Promise(function (resolve, reject) {
      publicLdapContext.units.getUnitByUniqueIdentifier(
        uniqueIdentifier,
        function (err, data) {
          resolve(data);
        }
      );
    });
    return result;
  },

  updateLDAPInformations() {
    let professors = Professors.find({}).fetch();
    professors.forEach((prof) => {
      Meteor.call("getUserFromLDAP", prof.sciper, (error, LDAPinformations) => {
        if (error) {
          console.log(`ERROR ${error}`);
        } else {
          let professorDocument = {
            displayName: LDAPinformations.displayName,
          };
          Professors.update({ _id: prof._id }, { $set: professorDocument });
        }
      });
    });
  },

  associateTagsToSite(site, tags) {
    if (!this.userId) {
      throw new Meteor.Error("not connected");
    }

    const canAssociate = Roles.userIsInRole(
      this.userId,
      ["admin", "tags-editor"],
      Roles.GLOBAL_GROUP
    );

    if (!canAssociate) {
      throw new Meteor.Error(
        "unauthorized",
        "Only admins and editors can associate tags to a site."
      );
    }

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
