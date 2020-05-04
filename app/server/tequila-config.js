import Tequila from "meteor/epfl:accounts-tequila";
import { loadFixtures } from './fixtures';

loadFixtures();

Tequila.start({
  service: "wp-veritas",
  request: ["uniqueid", "email", "group"],
  bypass: ["/api"],
  getUserId(tequila) {
    if (tequila.group.includes("wp-veritas-admins")) {
      Roles.setUserRoles(tequila.uniqueid, ["admin"], Roles.GLOBAL_GROUP);
      console.log("Admin");
    } else if (tequila.group.includes("wp-veritas-editors")) {
      Roles.setUserRoles(tequila.uniqueid, ["tags-editor"], Roles.GLOBAL_GROUP);
    } else {
      Roles.setUserRoles(tequila.uniqueid, ["epfl-member"], Roles.GLOBAL_GROUP);
    }
    // Greg is admin forever and even after
    /*
    if (tequila.uniqueid === "188475") {
      Roles.setUserRoles(tequila.uniqueid, ["admin"], Roles.GLOBAL_GROUP);
    }
    */

    
    return tequila.uniqueid;
  },
  upsert: (tequila) => ({
    $set: {
      username: tequila.user,
      emails: [tequila.email],
    },
  }),
});
