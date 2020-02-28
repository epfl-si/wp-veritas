#!/usr/bin/env node

// Ressources :
// TUTO: https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac

const program = require('commander');
const commands = require('./lib/command');

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

// allow commander to parse `process.argv`
program.parse(process.argv);
