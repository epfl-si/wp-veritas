async function createUser() {
  await Meteor.users.upsertAsync(
    { username: "toto" },
    {
      // Modifier
      $set: {
        username: "toto",
        emails: ["toto.epfl.ch"],
      },
    }
  );

  let user = await Meteor.users.findOneAsync({ username: "toto" });
  let userId = user._id;

  Roles.setUserRoles(userId, ["admin"], "wp-veritas");

  return userId;
}

export {
  createUser,
}
