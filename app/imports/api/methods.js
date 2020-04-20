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
  }
});
