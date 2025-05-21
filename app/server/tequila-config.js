import Tequila from "meteor/epfl:accounts-tequila";

Tequila.start({
  service: "wp-veritas",
  request: ["uniqueid", "email", "group"],
  bypass: ["/api/"],
  async getUserId(tequila) {
    if (tequila.group.includes("wp-veritas-admins")) {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["admin"], "wp-veritas");
    } else if (tequila.group.includes("wp-veritas-editors")) {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["tags-editor"], "wp-veritas");
    } else {
      await Roles.setUserRolesAsync(tequila.uniqueid, ["epfl-member"], "wp-veritas");
    }

    return tequila.uniqueid;
  },
  upsert: (tequila) => ({
    $set: {
      username: tequila.user,
      emails: [tequila.email],
    },
  }),
  tequila_fetchattributes_options: {
    allowedrequesthosts: process.env.WP_VERITAS_TEQUILA_ALLOWED_HOSTS,
  }
});
