const MongoClient = require("mongodb").MongoClient;
const config = require("./config.js");
const dbHelpers = require("./db-helper.js");
const helpers = require("./helpers.js");

const _restore = async function (source) {
  const target = dbHelpers.getTarget(source);
  if (["prod-on-dev", "prod-on-test"].includes(source)) {
    source = "prod";
  }
  const sourceConnectionString = dbHelpers.getConnectionString(source);
  const targetConnectionString = dbHelpers.getConnectionString(target);

  console.log("STEP 0: PREPARE PARAMETERS");
  console.log(`DB Source ${source} => DB Target ${target}`);
  console.log(`ConnectionString of source: ${sourceConnectionString}`);
  console.log(`ConnectionString of target: ${targetConnectionString}`);
  console.log("");

  // Delete target DB
  console.debug("STEP 1: DELETE ALL DOCUMENTS");
  await dbHelpers.deleteAllDocuments(targetConnectionString, target);
  console.log("");

  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // Delete dump folder
  console.log("STEP 2: DELETE DUMP FOLDER");
  await helpers.deleteDumpFolder();
  console.log("Delete dump folder");
  console.log("");

  // wait few secondes
  //await new Promise((resolve) => setTimeout(resolve, 5000));

  // Dump source DB
  console.log("STEP 3: DUMP SOURCE DB");
  await dbHelpers.dumpMongoDB(sourceConnectionString);
  console.log(`Dump ${source} MongoDB`);
  console.log("");

  // wait few secondes
  await new Promise((resolve) => setTimeout(resolve, 8000));

  // Move dump/wp-veritas
  console.log("STEP 4: NEED TO MOVE dump/wp-veritas ?");
  if (target === config.LOCAL_TARGET_TEST_DB_HOST) {
    await helpers.moveDumpFolder("meteor");
    console.log("Move wp-veritas/ to meteor/");
  } else if (target === "test") {
    await helpers.moveDumpFolder(config.TEST_DB_NAME);
    console.log("Move wp-veritas/ to wp-veritas-test/");
  } else {
    console.log("No");
  }
  console.log("");

  // wait few secondes
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Restore source DB on target DB
  console.log("STEP 5: RESTORE SOURCE ON TARGET");
  let dbName = "wp-veritas";
  if (target === "test") {
    dbName = config.TEST_DB_NAME;
  } else if (target === config.LOCAL_TARGET_TEST_DB_HOST) {
    dbName = "meteor";
  }
  await dbHelpers.restoreMongoDB(targetConnectionString, dbName);
  console.log("");
};

const _loadTestData = async function (destination) {
  let connectionString = dbHelpers.getConnectionString(destination);
  console.log(connectionString);

  // Delete all documents of 'sites' collection
  await dbHelpers.deleteAllDocuments(connectionString, destination, "sites");

  // parse data
  let data = helpers.parseData();

  // load data
  await helpers.loadData(destination, data);

  return true;
};

module.exports.deleteAllDocuments = async function () {
  const target = config.LOCAL_TARGET_TEST_DB_HOST;
  const connectionString = dbHelpers.getConnectionString(target);
  console.log("Connection string of Target:", connectionString);
  await dbHelpers.deleteAllDocuments(connectionString, target);
};

module.exports.restoreTestDatabase = async function () {
  const source = "test";
  await _restore(source);
  console.log("Restore test database");
  return true;
};

module.exports.restoreProdDatabase = async function () {
  await _restore("prod");
  console.log("Restore prod database");
  return true;
};

module.exports.restoreProdDatabaseOnDev = async function () {
  await _restore("prod-on-dev");
  console.log("Restore prod database on dev database");
  return true;
};

module.exports.restoreProdDatabaseOnTest = async function () {
  await _restore("prod-on-test");
  console.log("Restore prod database on test database");
  return true;
};

module.exports.loadTestsDataOnLocalhost = async function () {
  let destination = config.LOCAL_TARGET_TEST_DB_HOST;
  await _loadTestData(destination);
  console.log("Load tests data on localhost DB");
  return true;
};

module.exports.loadTestsDataOnDev = async function () {
  let destination = "dev";
  await _loadTestData(destination);
  console.log("Load tests data on dev DB");
  return true;
};

module.exports.loadTestsDataOnTest = async function () {
  let destination = "test";
  await _loadTestData(destination);
  console.log("Load tests data on test DB");
  return true;
};
