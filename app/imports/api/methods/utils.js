function trimObjValues(obj) {
  return Object.keys(obj).reduce((acc, curr) => {
    acc[curr] = obj[curr].trim();
    return acc;
  }, {});
}

checkUserAndRole = (userId, roles, msg) => {
  if (!userId) {
    throw new Meteor.Error("not connected");
  }

  const canDoAction = Roles.userIsInRole(userId, roles, "wp-veritas");

  if (!canDoAction) {
    throw new Meteor.Error("unauthorized", msg);
  }
};

export { trimObjValues, checkUserAndRole };
