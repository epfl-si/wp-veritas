var MongoClient = require('mongodb').MongoClient;
var config = require("./config.js");
const { exec } = require('child_process');

/**
 * Delete all documents of collection
 * @param {} connectionString of the DB
 */
var deleteAllDocuments = async function (connectionString) {

  // We remove documents only of localhost DB
  if (!connectionString.includes('localhost')) {
    throw "STOP don't TOUCH !";
  }
  const client = await MongoClient.connect(connectionString, {useUnifiedTopology: true});
  const db = client.db(config.DB_NAME);

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

  let message = "All documents are deleted";
  return message;
}

/**
 * Deleting the dump/ directory
 */
var step0 = async function () {
  let msg = "Step 0: Delete the dump/ directory"
  await new Promise(
    function(resolve, reject){
      let command = "rm dump/ -rf";  
      resolve(exec(command));
    }
  );
  return msg;
}

/**
 * Delete all documents
 */
var step1 = async function () {
  let mainMsg = "Step 1: Deleting all documents";
  console.log(mainMsg);   

  // We remove documents only of localhost DB
  if (!config.HOST.includes('localhost')) {
    throw "STOP don't TOUCH !";
  }

  var connectionString = `mongodb://${ config.HOST }:${ config.PORT }/`;
  let msg = await deleteAllDocuments(connectionString);

  return msg;
}

var step2 = async function () {
  let msg = "Step 2: Dump production database";
  await new Promise(
    function(resolve, reject) { 
      let connectionString = `mongodb://wp-veritas-test:${ config.TEST_DB_PWD }@mongodb-svc-1.epfl.ch/wp-veritas-test`;
      let command = `mongodump --forceTableScan  --uri ${ connectionString }`;
      resolve(exec(command));
    }
  )
  return msg;
}

var step3 = async function () {
  let msg = "Step 1: Renommer le repertoire de dump";  
  await new Promise(
    function(resolve, reject) { 
      let command = 'mv dump/wp-veritas-test/ dump/meteor/';
      resolve(exec(command));
    }
  )
  return msg;
}

var step4 = async function() {
  let msg = "Restaurer la DB en local";
  await new Promise(
    function(resolve, reject) { 
      let command = "mongorestore dump/ --host=localhost:3001";
      resolve(exec(command));
    }
  )
  return msg;
}

var main = async function () {

  let msgStep0 = await step0();
  console.log(msgStep0);

  let msgStep1 = await step1();
  console.log(msgStep1);

  let msgStep2 = await step2();
  console.log(msgStep2);

  // wait few secondes
  await new Promise(resolve => setTimeout(resolve, 5000));

  let msgStep3 = await step3();
  console.log(msgStep3);

  let msgStep4 = await step4();
  console.log(msgStep4);

  console.log("Data import is complete !");
}  

try {
  console.log(process.argv);
  main();
} catch(e) {
  console.error("ERROR !!!!");
  console.error(e);
}