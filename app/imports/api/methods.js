// TODO: How use ValidatedMethod with async/await meteor methods ?
// I have the same problem as https://stackoverflow.com/questions/54401422/meteor-async-validatedmethod-gets-called-with-function-parameters-undefined
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
