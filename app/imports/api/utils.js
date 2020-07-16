getEnvironment = () => {
  const absoluteUrl = Meteor.absoluteUrl();
  let environment;
  if (absoluteUrl.startsWith("http://localhost")) {
    environment = "LOCALHOST";
  } else if (
    absoluteUrl.startsWith("https://wp-veritas.128.178.222.83.nip.io/")
  ) {
    environment = "TEST";
  } else {
    environment = "PROD";
  }
  return environment;
}

export { getEnvironment }