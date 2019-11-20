import Tequila from "meteor/epfl:accounts-tequila";

Tequila.start({
  service: 'wp-veritas',
  request: ['uniqueid', 'email'],
  bypass: ['/api'],
  getUserId(tequila) {
    if (tequila.uniqueid == "188475") {
      Roles.setUserRoles(tequila.uniqueid, ['editor'], Roles.GLOBAL_GROUP); 
      Roles.setUserRoles(tequila.uniqueid, ['admin'], Roles.GLOBAL_GROUP); 
    }
    // Add epfl-member by default
    if (!Roles.userIsInRole(tequila.uniqueid, ['admin', 'tags-editor', 'epfl-member'], Roles.GLOBAL_GROUP)) {
      Roles.addUsersToRoles(tequila.uniqueid, 'epfl-member', Roles.GLOBAL_GROUP);  
    }
    return tequila.uniqueid;
  },
  upsert: (tequila) => ({ $set: {
    profile: {
      sciper: tequila.uniqueid
    },
    username: tequila.user,
    emails: [ tequila.email ],
  }}),
}); 