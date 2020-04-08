#!/usr/bin/env node

// Ressources :
// TUTO: https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac

const program = require('commander');
const commands = require('./lib/command');
const config = require("./lib/config.js");

program
  .command('clean-all-documents')
  .description('Delete all documents from the local MongoDB')
  .action(function () {
    commands.deleteAllDocuments();
  })

program
.command('restore-test-db')
.description('Restore the test MongoDB on local MongoDB')
.action(function () {
  commands.restoreTestDatabase();
})

program
.command('restore-prod-db')
.description('Restore the production MongoDB on local MongoDB')
.action(function () {
  commands.restoreProdDatabase();
})

program
.command('restore-prod-db-on-test')
.description('Restore the production MongoDB on test MongoDB')
.action(function () {
  commands.restoreProdDatabaseOnTest();
})

program
.command('load-tests-data-on-localhost-db')
.description('Load tests data on localhost MongoDB')
.action(function () {
  commands.loadTestsDataOnLocalhost();
})

program
.command('load-tests-data-on-test-db')
.description('Load tests data on test MongoDB')
.action(function () {
  commands.loadTestsDataOnTest();
})

let rootDirectory = config.WORKSPACE_PATH + "wp-veritas";
if (process.env.PWD !== rootDirectory) {
  console.log("You need to get to the root of project wp-veritas.");
  console.log("Please run:");
  console.log(`cd ${rootDirectory}`);
} else {
  // allow commander to parse `process.argv`
  program.parse(process.argv);
}