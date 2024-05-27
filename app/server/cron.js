import { Sites, Professors } from '../imports/api/collections';

SyncedCron.add({
  name: 'Update professors name',
  schedule: function(parser) {
    return parser.text('every 24 hours');
  },
  job: async function(intendedAt) {
    console.log("Update professors ...");

    const publicLdapContext = require('epfl-ldap')();
    
    let professors = await Professors.find({}).fetchAsync();
    professors.forEach(prof => {
      publicLdapContext.users.getUserBySciper(prof.sciper, function(err, user) {

        let professorDocument = {
          displayName: user.displayName,
        }
        Professors.update(
          { _id: prof._id }, 
          { $set: professorDocument }
        );

        let profAfter = Professors.findOne(prof._id);
        console.log(`Prof: ${profAfter.sciper} after update => DisplayName: ${profAfter.displayName}`);
        
      })
    });
    console.log('All professors updated:', intendedAt);
  }
});

SyncedCron.add({
  name: 'Update unit names',
  schedule: function(parser) {
    // Note: epfl-ldap-js cache is 4 hours
    // Charles François said, "Changes in unit structure are currently only made once a night."
    return parser.text('every 24 hours');
  },
  job: async function(intendedAt) {
    console.log("Update unitName and unitNameLevel2 of each site starting ...");
    
    const fullLdapContext = require('epfl-ldap')();
    fullLdapContext.options.modelsMapper = fullLdapContext.viewModelsMappers.full;

    // Update all sites
    let sites = await Sites.find({}).fetchAsync();
    sites.forEach(site => {

      if ('wpInfra' in site && site.wpInfra) {

        fullLdapContext.units.getUnitByUniqueIdentifier(site.unitId, async function(err, unit) {

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

          await Sites.updateAsync(
            { _id: site._id },
            { $set: {
            'unitName': unitName,
            'unitNameLevel2': unitNameLevel2
            }},
          );

          let newSite = await Sites.findOneAsync(site._id);
          console.log(`Site: ${newSite.url} after update => unitName: ${newSite.unitName} UnitNameLevel2: ${newSite.unitNameLevel2}`);
        
        });
        
      }
    });
    console.log('All sites updated:', intendedAt);
  }
});