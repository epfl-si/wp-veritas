import Tequila from "meteor/epfl:accounts-tequila";

Tequila.start({
  service: "wp-veritas",
  request: ["uniqueid", "email", "group"],
  bypass: ["/api"],
  async getUserId(tequila) {
    if (tequila.group.includes("wp-veritas-admins")) {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["admin"], "wp-veritas");
    } else if (tequila.group.includes("wp-veritas-editors")) {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["tags-editor"], "wp-veritas");
    } else {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["epfl-member"], "wp-veritas");
    }

    // Greg is admin forever and even after
    if (tequila.uniqueid === "188475") {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["admin"], "wp-veritas");
      // Roles.setUserRoles(tequila.uniqueid, ["tags-editor"], "wp-veritas");
    }

    return tequila.uniqueid;
  },
  upsert: (tequila) => ({
    $set: {
      username: tequila.user,
      emails: [tequila.email],
    },
  }),
});
