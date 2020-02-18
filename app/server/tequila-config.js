import Tequila from "meteor/epfl:accounts-tequila";

Tequila.start({
  service: 'wp-veritas',
  request: ['uniqueid', 'email', 'group'],
  bypass: ['/api'],
  getUserId(tequila) {
    let groups = tequila.group.split(",");
    if (groups.includes('wp-veritas-admins')) {
      Roles.setUserRoles(tequila.uniqueid, ['admin'], Roles.GLOBAL_GROUP);
    } else if (groups.includes('wp-veritas-editors')) {
      Roles.setUserRoles(tequila.uniqueid, ['tags-editor'], Roles.GLOBAL_GROUP);
    } else {
      Roles.setUserRoles(tequila.uniqueid, ['epfl-member'], Roles.GLOBAL_GROUP);
    }
    // Greg is admin forever and even after
    if (tequila.uniqueid == "188475") {
      Roles.setUserRoles(tequila.uniqueid, ['admin'], Roles.GLOBAL_GROUP); 
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