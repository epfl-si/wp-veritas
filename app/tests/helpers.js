function createUser() {
  Meteor.users.upsert(
    { username: "toto" },
    {
      // Modifier
      $set: {
        username: "toto",
        emails: ["toto.epfl.ch"],
      },
    }
  );

  let user = Meteor.users.findOne({ username: "toto" });
  let userId = user._id;

  Roles.setUserRoles(userId, ["admin"], "wp-veritas");

  return userId;
}

export {
  createUser,
}