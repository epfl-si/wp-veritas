export function throwMeteorError(fieldName, message, additional = false) {
  const ddpError = new Meteor.Error(message);
  ddpError.error = "validation-error";
  ddpError.details = additional
    ? [{ name: fieldName, message, additional }]
    : [{ name: fieldName, message }];
  throw ddpError;
}
