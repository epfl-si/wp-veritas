const MongoClient = require('mongodb').MongoClient;
var config = require("./config.js");
const { exec } = require('child_process');
/**
 * Delete all documents of collection
 * @param {} connectionString of the DB
 */
const _deleteAllDocuments = async function (connectionString, environment) {

  console.log(connectionString);

  // We remove documents only of localhost DB and TEST DB
  if (!connectionString.includes('localhost') && !connectionString.includes('wp-veritas-test')) {
    throw "STOP don't TOUCH !";
  }

  const client = await MongoClient.connect(connectionString, {useUnifiedTopology: true});

  let db;
  if (environment === "test") {
    dbName = 'wp-veritas-test';
  } else if (environment === "localhost") {
    dbName = "meteor";
  }
  db = client.db(dbName);
  
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
      if (source == "prod" || source == "prod-on-test") {
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
      let command;

      if (source === 'prod-on-test') {
        command = `mv ${ config.WORKSPACE_PATH }wp-veritas/dump/wp-veritas/ ${ config.WORKSPACE_PATH }wp-veritas/dump/wp-veritas-test/`;
      } else {
        if (source == "prod") {
          folder_name = "wp-veritas";
        } else if (source == "test") {
          folder_name = "wp-veritas-test";
        }
        command = `mv ${ config.WORKSPACE_PATH }wp-veritas/dump/${folder_name}/ ${ config.WORKSPACE_PATH }wp-veritas/dump/meteor/`;
      }
      resolve(exec(command));
    }
  );
  return true;
}

const _restoreDataToLocalMongoDB = async function(source) {

  if (source === 'prod-on-test') {
    await new Promise(
      function(resolve, reject) { 
        let connectionString = `mongodb://${ config.TEST_HOST }:${ config.TEST_DB_PWD }@mongodb-svc-1.epfl.ch/${ config.TEST_HOST }`;
        let command = `mongorestore --db="${ config.TEST_HOST }" --uri="${ connectionString }" dump/${ config.TEST_HOST }`;
        resolve(exec(command));
      }
    )
  } else {
    await new Promise(
      function(resolve, reject) { 
        let command = "mongorestore dump/ --host=localhost:3001";
        resolve(exec(command));
      }
    )
  }
  return true;
}

const _restore = async function (source) {
  
  let connectionString = `mongodb://localhost:3001/`;
  let environment = 'localhost';

  if (source === 'prod-on-test') {
    connectionString = `mongodb://${ config.TEST_HOST }:${ config.TEST_DB_PWD }@mongodb-svc-1.epfl.ch/${ config.TEST_HOST }`;
    environment = 'test';
  }
  console.log(`ConnectionString: ${connectionString}`);
  console.log(`Environnement: ${environment}`);
  
  await _deleteAllDocuments(connectionString, environment);
  
  await _deleteDumpFolder();
  console.log("Delete dump folder");

  // wait few secondes
  await new Promise(resolve => setTimeout(resolve, 5000));

  await _dumpMongoDB(source);
  console.log(`Dump ${source} MongoDB`);

  // wait few secondes
  await new Promise(resolve => setTimeout(resolve, 8000));

  await _moveDumpFolder(source);
  if (source == 'prod-on-test') {
    console.log(`Move wp-veritas/ to wp-veritas-test/`);
  } else {
    if (source == 'test') {
      dbName = 'wp-veritas-test';
    } else {
      dbName = 'wp-veritas';
    }
    console.log(`Move ${dbName}/ to meteor/`);
  }
  
  // wait few secondes
  await new Promise(resolve => setTimeout(resolve, 5000));
    
  await _restoreDataToLocalMongoDB(source);

  return true;
}

const _loadTestData = async function (destination) {

  
  
  let connectionString;
  if (destination === 'localhost') {
    connectionString = `mongodb://localhost:3001/`;
  } else if (destination === 'test') {
    connectionString = `mongodb://${ config.TEST_HOST }:${ config.TEST_DB_PWD }@mongodb-svc-1.epfl.ch/${ config.TEST_HOST }`;
  }
  console.log(connectionString);
  const client = await MongoClient.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
  
  // Delete all documents of 'sites' collection
  let db;
  if (destination === "test") {
    dbName = 'wp-veritas-test';
  } else if (destination === "localhost") {
    dbName = "meteor";
  }
  db = client.db(dbName);
  await db.collection('sites').deleteMany({});
  client.close();

  
  console.log("Delete all documents of 'sites' collection");

  // Parse data
  var fs = require('fs');
  var myjson = JSON.parse(fs.readFileSync(config.WORKSPACE_PATH + 'wp-veritas/app/private/inventory-test.json', 'utf8'));
  
  let sites = myjson['_meta']['hostvars'];
  //console.log(Object.values(sites));
  try {
    let i = 0;
    Object.values(sites).forEach(async currentSite => {

      if (i < 400) {

        console.log(i);
      
        //console.log(currentSite);
        
        let stop = false;
        let site = currentSite;
        let url, title, category, theme, languages;

        if (site.wp_hostname !== 'migration-wp.epfl.ch') {
          stop = true;
        }
        if (site.wp_env !== 'int') {
          stop = true;
        }
        
        if (!stop) {

          i = i + 1;

          url = `https://${ site.wp_hostname }/${ site.wp_path }`;
          title = site.wp_path;
          category = site['wp_details']['options']['epfl:site_category'];
          if (category == null) {
            category = 'GeneralPublic';
          }
          theme = site['wp_details']['options']['stylesheet'];;
          languages = site['wp_details']['polylang']['langs'];
          
          if (!languages) {
            stop = true;
          }
        }
        if (!stop) {
          console.log("Stop: ", stop);
          console.log("url: ", url);
          console.log("title: ", title);
          console.log("category: ", category);
          console.log("theme: ", theme);
          console.log("languages: ", languages);
          console.log("------------------");
        }

        
        if (!stop) {
          let unitId = site['wp_details']['options']['plugin:epfl_accred:unit_id'];
          let unitName = site['wp_details']['options']['plugin:epfl_accred:unit'];

          let siteDocument = {
            url: url,
            tagline: '',
            title: title,
            wpInfra: true,
            openshiftEnv: 'int',
            category: category,
            theme: theme,
            languages: languages,
            unitId: unitId,
            unitName: unitName,
            unitNameLevel2: '',
            snowNumber: '',
            comment: '',
            userExperience: false,
            slug: '',
            professors: [],
            tags: [],
          }
          console.log("STOP ?: ", stop);
          console.log(siteDocument);

          
          let connectionString;
          if (destination === 'localhost') {
            connectionString = `mongodb://localhost:3001/`;
          } else if (destination === 'test') {
            connectionString = `mongodb://${ config.TEST_HOST }:${ config.TEST_DB_PWD }@mongodb-svc-1.epfl.ch/${ config.TEST_HOST }`;
          }
          
          const client = await MongoClient.connect(
            connectionString, 
            {
              useNewUrlParser: true, 
              useUnifiedTopology: true, 
              connectTimeoutMS: 30000,
            }
          );
    
          let db;
          if (destination === "test") {
            dbName = 'wp-veritas-test';
          } else if (destination === "localhost") {
            dbName = "meteor";
          }
          db = client.db(dbName);

          let c = await db.collection("sites").insertOne(siteDocument);
          

          client.close();

        }
      }
      
    });
  }
  catch (error) { 
    console.log(error);
    
  }
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

module.exports.restoreProdDatabaseOnTest = async function () {
  await _restore('prod-on-test');
  console.log("Restore prod database on test database");
  return true;
}

module.exports.loadTestsDataOnLocalhost = async function () {
  let destination = 'localhost';
  await _loadTestData(destination);
  console.log("Load tests data on localhost DB");
  return true;
}

module.exports.loadTestsDataOnTest = async function () {
  let destination = 'test';
  await _loadTestData(destination);
  console.log("Load tests data on test DB");
  return true;
}