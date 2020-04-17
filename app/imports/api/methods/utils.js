function trimObjValues(obj) {
  return Object.keys(obj).reduce((acc, curr) => {
    if (curr !== "subcategories") {
      acc[curr] = obj[curr].trim();
    }
    return acc;
  }, {});
}

checkUserAndRole = (userId, roles, msg) => {
  if (!userId) {
    throw new Meteor.Error("not connected");
  }

  const canDoAction = Roles.userIsInRole(
    userId,
    roles,
    Roles.GLOBAL_GROUP
  );

  if (!canDoAction) {
    throw new Meteor.Error("unauthorized", msg);
  }
};

export { trimObjValues, checkUserAndRole };
