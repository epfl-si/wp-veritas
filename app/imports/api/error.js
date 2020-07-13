export function throwMeteorError(fieldName, message, additional = false) {
  const ddpError = new Meteor.Error(message);
  ddpError.error = "validation-error";
  ddpError.details = additional
    ? [{ name: fieldName, message, additional }]
    : [{ name: fieldName, message }];
  throw ddpError;
}

export function throwMeteorErrors(fieldNameList, message) {
  const ddpError = new Meteor.Error(message);
  ddpError.error = 'validation-error';
  errors = [];
  fieldNameList.forEach(fieldName => {
      errors.push({name: fieldName, message: message});
  });
  ddpError.details = errors;
  throw ddpError;
}
