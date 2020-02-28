const MongoClient = require('mongodb').MongoClient;
var config = require("./config.js");
const { exec } = require('child_process');
/**
 * Delete all documents of collection
 * @param {} connectionString of the DB
 */
const _deleteAllDocuments = async function (connectionString) {

  // We remove documents only of localhost DB
  if (!connectionString.includes('localhost')) {
    throw "STOP don't TOUCH !";
  }
  const client = await MongoClient.connect(connectionString, {useUnifiedTopology: true});
  const db = client.db("meteor");

  collectionsList = [
    "sites", 
    "tags", 
    "openshiftenvs", 
    "themes", 
    "types", 
    "categories", 
    "professors", 
    "AppLogs",
  ]
  
  collectionsList.forEach(async collection => { 
    let c = await db.collection(collection).deleteMany({});
    console.log(`All documents off ${ collection } collections are deleted`);
  });

  await db.collection("users").deleteMany({"username":{$nin:["charmier"]}});
  console.log(`All documents off users collections are deleted`);

  client.close();

  return true;
}

/**
 * Deleting the dump/ directory
 */
const _deleteDumpFolder = async function () {
  await new Promise(
    function(resolve, reject) {
      let command = `rm ${ config.WORKSPACE_PATH }wp-veritas/dump/ -rf`;
      resolve(exec(command));
    }
  );

  return true;
}

/**
 * Dump MongoDB
 */
const _dumpMongoDB = async function (source) {
  await new Promise(
    function(resolve, reject) {
      let HOST;
      let DB_PWD;
      if (source == "prod") {
        HOST = config.PROD_HOST;
        DB_PWD = config.PROD_DB_PWD;
      } else if (source == "test") {
        HOST = config.TEST_HOST;
        DB_PWD = config.TEST_DB_PWD;
      }
      let connectionString = `mongodb://${ HOST }:${ DB_PWD }@mongodb-svc-1.epfl.ch/${ HOST }`;
      let command = `mongodump --forceTableScan  --uri ${ connectionString }`;
      resolve(exec(command));
    }
  );
  return true;
}

const _moveDumpFolder =  async function (source) {
  await new Promise(
    function(resolve, reject) { 
      let folder_name;
      if (source == "prod") {
        folder_name = "wp-veritas";
      } else if (source == "test") {
        folder_name = "wp-veritas-test";
      }
      let command = `mv ${ config.WORKSPACE_PATH }wp-veritas/dump/${folder_name}/ ${ config.WORKSPACE_PATH }wp-veritas/dump/meteor/`;
      console.log(command);
      resolve(exec(command));
    }
  );
  return true;
}

const _restoreDataToLocalMongoDB = async function() {
  await new Promise(
    function(resolve, reject) { 
      let command = "mongorestore dump/ --host=localhost:3001";
      resolve(exec(command));
    }
  )
  return true;
}

const _restore = async function (source) {
  await _deleteDumpFolder();
  console.log("Delete dump folder");

  // wait few secondes
  await new Promise(resolve => setTimeout(resolve, 5000));

  await _dumpMongoDB(source);
  console.log(`Dump ${source} MongoDB`);

  // wait few secondes
  await new Promise(resolve => setTimeout(resolve, 5000));

  await _moveDumpFolder(source);
  if (source == 'test') {
    dbName = 'wp-veritas-test';
  } else {
    dbName = 'wp-veritas';
  }
  console.log(`Move ${dbName}/ to meteor/`);

  await _restoreDataToLocalMongoDB();
  return true;
}

module.exports.deleteAllDocuments = async function () {
  const connectionString = `mongodb://localhost:3001/`;
  await _deleteAllDocuments(connectionString);
}

module.exports.restoreTestDatabase = async function () {
  await _restore('test');
  console.log("Restore test database");
  return true;
}

module.exports.restoreProdDatabase = async function () {
  await _restore('prod');
  console.log("Restore prod database");
  return true;
}

