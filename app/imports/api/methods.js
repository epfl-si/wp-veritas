import { check } from "meteor/check";

Meteor.methods({

  async getUserFromLDAP(sciper) {
    check(sciper, String);
    let result;
    const publicLdapContext = require("epfl-ldap")();
    result = await new Promise(function (resolve, reject) {
      publicLdapContext.users.getUserBySciper(sciper, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    return result;
  },

  async getUnitFromLDAP(uniqueIdentifier) {
    check(uniqueIdentifier, String);
    let result;
    const publicLdapContext = require("epfl-ldap")();
    return await new Promise(function (resolve, reject) {
      publicLdapContext.units.getUnitByUniqueIdentifier(
        uniqueIdentifier,
        function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    });
  },
  
});
