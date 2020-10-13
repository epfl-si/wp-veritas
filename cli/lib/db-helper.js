const MongoClient = require("mongodb").MongoClient;
const { exec } = require("child_process");
const config = require("./config.js");

/**
 * Get target
 */
module.exports.getTarget = (source) => {
  if (
    ["test", "prod", "prod-on-dev", "prod-on-test"].includes(source) === false
  ) {
    throw new Error("Source is unknown");
  }
  let target;
  if (source === "test" || source === "prod") {
    target = "localhost";
  } else if (source === "prod-on-dev") {
    target = "dev";
  } else if (source === "prod-on-test") {
    target = "test";
  }
  return target;
};

/**
 * Get connection String
 */
module.exports.getConnectionString = (environment) => {
  if (["localhost", "dev", "test", "prod"].includes(environment) === false) {
    throw new Error("Environment is unknown");
  }

  if (environment === "localhost") {
    return `mongodb://${config.LOCAL_DB_HOST}:${config.LOCAL_DB_PORT}/`;
  }

  let dbUsername;
  let dbPwd;
  let dbHost;
  let dbName;

  if (environment === "dev") {
    dbUsername = config.DEV_DB_USERNAME;
    dbPwd = config.DEV_DB_PWD;
    dbHost = config.DEV_DB_HOST;
    dbName = config.DEV_DB_NAME;
  }

  if (environment === "test") {
    dbUsername = config.TEST_DB_USERNAME;
    dbPwd = config.TEST_DB_PWD;
    dbHost = config.TEST_DB_HOST;
    dbName = config.TEST_DB_NAME;
  }

  if (environment === "prod") {
    dbUsername = config.PROD_DB_USERNAME;
    dbPwd = config.PROD_DB_PWD;
    dbHost = config.PROD_DB_HOST;
    dbName = config.PROD_DB_NAME;
  }

  return `mongodb://${dbUsername}:${dbPwd}@${dbHost}.epfl.ch/${dbName}`;
};

createClient = async function (connectionString) {
  // Check DB
  if (
    !connectionString.includes(config.LOCAL_DB_HOST) &&
    !connectionString.includes("@test-mongodb-svc-1.epfl.ch/")
  ) {
    throw new Error("STOP don't TOUCH on this DB !");
  }

  const client = await MongoClient.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
  });

  return client;
};

getDB = function (target, client) {
  let dbName;
  if (target === "dev") {
    dbName = config.DEV_DB_NAME;
  } else if (target === "test") {
    dbName = config.TEST_DB_NAME;
  } else if (target === "localhost") {
    dbName = "meteor";
  }
  return client.db(dbName);
};

/**
 * Insert one site
 */
module.exports.insertOneSite = async function (
  connectionString,
  target,
  siteDocument
) {
  // Generate a new id
  let id = Math.random().toString(36).substring(2);
  siteDocument["_id"] = id;
  const client = await createClient(connectionString);
  const db = getDB(target, client);
  await db.collection("sites").insertOne(siteDocument);
  client.close();
};



/**
 * Get category
 */
module.exports.getCategories = async function (
  connectionString,
  target,
  categoriesName
) {
  let categories = []
  for (let categoryName of categoriesName) {
    const client = await createClient(connectionString);
    const db = getDB(target, client);
    let category = await db
      .collection("categories")
      .find({ name: categoryName }).toArray();
    categories.push(category[0])
    client.close();
  }
  return categories;
};

/**
 * Delete all documents of collection.
 *
 * We remove all documents only of source DB (i.e. localhost DB or test DB)
 */
module.exports.deleteAllDocuments = async function (
  connectionString,
  target,
  collectionToDelete = "all"
) {
  const client = await createClient(connectionString);
  const db = getDB(target, client);

  if (collectionToDelete === "all") {
    await db.collection("sites").deleteMany({});
    console.log(`All documents off sites collections are deleted`);

    await db.collection("tags").deleteMany({});
    console.log(`All documents off tags collections are deleted`);

    await db.collection("openshiftenvs").deleteMany({});
    console.log(`All documents off openshiftenvs collections are deleted`);

    await db.collection("themes").deleteMany({});
    console.log(`All documents off themes collections are deleted`);

    await db.collection("categories").deleteMany({});
    console.log(`All documents off categories collections are deleted`);

    await db.collection("professors").deleteMany({});
    console.log(`All documents off professors collections are deleted`);

    await db.collection("AppLogs").deleteMany({});
    console.log(`All documents off AppLogs collections are deleted`);

    await db
      .collection("users")
      .deleteMany({ username: { $nin: ["charmier"] } });
    console.log(`All documents off users collections are deleted`);
  } else {
    await db.collection(collectionToDelete).deleteMany({});
    console.log(
      `All documents off ${collectionToDelete} collections are deleted`
    );
  }
  client.close();
};

/**
 * Dump data of source DB
 */
module.exports.dumpMongoDB = async function (connectionString) {
  await new Promise(function (resolve, reject) {
    // mongodump is a native executable, please install mongo-tools
    // and be sure to have a version with the --uri option avalaible.
    const command = `mongodump --forceTableScan --uri ${connectionString}`;
    console.log(command);
    resolve(exec(command));
  });
};

/**
 * Restore data on target DB
 */
module.exports.restoreMongoDB = async function (connectionString, dbName) {
  // Check DB
  if (
    !connectionString.includes(config.LOCAL_DB_HOST) &&
    !connectionString.includes("@test-mongodb-svc-1.epfl.ch/")
  ) {
    throw new Error("STOP don't TOUCH on this DB !");
  }

  await new Promise(function (resolve, reject) {
    let command = `mongorestore --db="${dbName}" --uri="${connectionString}" dump/${dbName}`;
    console.log("Restore command: ", command);
    resolve(exec(command));
  });
};
