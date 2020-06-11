export function throwMeteorError(fieldName, message) {
  const ddpError = new Meteor.Error(message);
  ddpError.error = "validation-error";
  ddpError.details = [{ name: fieldName, message: message }];
  throw ddpError;
}
