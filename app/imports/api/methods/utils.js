function trimObjValues(obj) {
  return Object.keys(obj).reduce((acc, curr) => {
    if (curr !== "subcategories") {
      acc[curr] = obj[curr].trim();
    }
    return acc;
  }, {});
}

checkUserAndRole = (userId, msg) => {
  if (!userId) {
    throw new Meteor.Error("not connected");
  }

  const canDoAction = Roles.userIsInRole(
    userId,
    ["admin", "tags-editor"],
    Roles.GLOBAL_GROUP
  );

  if (!canDoAction) {
    throw new Meteor.Error("unauthorized", msg);
  }
};

export { trimObjValues, checkUserAndRole };
