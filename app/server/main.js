import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import '../imports/api/methods'; // Call meteor methods backend
import './publications'; // Call meteor publications backend
import { importData } from './import-data';
import { AppLogger } from './logger';
import './indexes';
import { Sites } from '../imports/api/collections';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let importDatas = true;
  
if (Meteor.isServer) {
  import './tequila-config';
  import './rest-api';

  // Setting up logs
  new AppLogger();

  if (importDatas) {
    importData();
  }

  SyncedCron.config({
    collectionName: 'somethingDifferent'
  });

  SyncedCron.add({
    name: 'Update unit names',
    schedule: function(parser) {
      // Note: epfl-ldap-js cache is 4 hours
      // Charles François said, "Changes in unit structure are currently only made once a night."
      return parser.text('every 24 hours');
    },
    job: function(intendedAt) {
      console.log("Update unitName and unitNameLevel2 of each site starting ...");
      
      const fullLdapContext = require('epfl-ldap')();
      fullLdapContext.options.modelsMapper = fullLdapContext.viewModelsMappers.full;

      // Update all sites
      let sites = Sites.find({}).fetch();
      sites.forEach(site => {

        fullLdapContext.units.getUnitByUniqueIdentifier(site.unitId, function(err, unit) {

          let unitName = '';
          let unitNameLevel2 = '';

          if ('cn' in unit) {
            unitName = unit.cn;
          }
          if ('dn' in unit) {
            let dn = unit.dn.split(",");
            if (dn.length == 5) {
              // dn[2] = 'ou=associations'
              unitNameLevel2 = dn[2].split("=")[1];
            }
          }

          Sites.update(
            { _id: site._id },
            { $set: {
            'unitName': unitName,
            'unitNameLevel2': unitNameLevel2
            }},
          );

          let newSite = Sites.findOne(site._id);
          console.log(`Site: ${newSite.url} after update => unitName: ${newSite.unitName} UnitNameLevel2: ${newSite.unitNameLevel2}`);
          
        });
      });
      console.log('All sites updated:', intendedAt);
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
    SyncedCron.start();
  });
}
