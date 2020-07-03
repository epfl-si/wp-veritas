
export function throwMeteorError(fieldName, message) {
  const ddpError = new Meteor.Error(message);
  ddpError.error = 'validation-error';
  ddpError.details = [{name: fieldName, message: message}];
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
