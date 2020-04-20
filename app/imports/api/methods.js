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
  
});
