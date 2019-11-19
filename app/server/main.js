import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import '../imports/api/methods'; // Call meteor methods backend
import './publications'; // Call meteor publications backend
import { importData } from './import-data';
import { AppLogger } from './logger';
import './indexes';
import './tequila-config';
import './rest-api';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let importDatas = false;
  
if (Meteor.isServer) {

  // Setting up logs
  new AppLogger();

  if (importDatas) {
    importData();
  }
}
