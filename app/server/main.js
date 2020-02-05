import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import '../imports/api/methods'; // Call meteor methods backend
import './publications'; // Call meteor publications backend
import { importData } from './import-data';
import { removeAllCollections } from './removeAllCollections';
import { AppLogger } from './logger';
import './indexes';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let importDatas = false;
  
if (Meteor.isServer) {
  /*
  import context from 'epfl-ldap';
  //console.log(context);

  const c = context();
  console.log(c.units.getUnitByUniqueIdentifier);

  c.units.getUnitByUniqueIdentifier(10208, function(err, data) {
    console.log(JSON.stringify(data, null, 2));
  });*/

  var fullLdapContext = require('epfl-ldap')();
  fullLdapContext.options.modelsMapper = fullLdapContext.viewModelsMappers.full;
  console.log(fullLdapContext.units.getUnitByName);

  fullLdapContext.units.getUnitByName("SI - Full-Stack Development", function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  });

  import './tequila-config';
  import './rest-api';

  // Setting up logs
  new AppLogger();

  if (importDatas) {
    //removeAllCollections();
    importData();
  }
}
