getEnvironment = () => {
  let environment;
  const absoluteUrl = Meteor.absoluteUrl();

  if (absoluteUrl.startsWith("http://localhost:3888")) {
    environment = "TEST-SUITE";
  } else if (absoluteUrl.startsWith("http://localhost")) {
    environment = "LOCALHOST";
  } else if (absoluteUrl.startsWith("https://wp-veritas.128.178.222.83.nip.io")) {
    environment = "DEV";
  } else if (absoluteUrl.startsWith("https://wp-veritas-test.epfl.ch")) {
    environment = "TEST";
  } else if (absoluteUrl.startsWith("https://wp-veritas.epfl.ch")) {
    environment = "PROD";
  }
  return environment;
};

export { getEnvironment };
