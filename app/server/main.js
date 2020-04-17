import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import '../imports/api/methods'; // Call meteor methods backend
import './publications'; // Call meteor publications backend
import { importData } from './import-data';
import { AppLogger } from '../imports/api/logger';
import './indexes';
import "../imports/api/methods/tags";
import "../imports/api/methods/themes";
import "../imports/api/methods/professors";
import "../imports/api/methods/categories";
import "../imports/api/methods/openshift-env";

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let importDatas = false;
  
if (Meteor.isServer) {
  import './tequila-config';
  import './rest-api';
  import './cron';

  // Setting up logs
  new AppLogger();

  if (importDatas) {
    importData();
  }
  
  Meteor.startup(function () {
    // code to run on server at startup
    SyncedCron.start();
  });
}
