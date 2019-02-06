import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Sites } from '../both';
import './publications';
import getUnits from './units';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let activeTequila = false;

if (Meteor.isServer) {

  if (activeTequila) {

    Tequila.options.request = ['uniqueid', 'email'];

    // In Meteor.users documents, the _id is the user's SCIPER:
    Tequila.options.getUserId = function getUserId(tequilaResponse) {
    
      Meteor.users.upsert(
        { _id: tequilaResponse.uniqueid, },
        { 
          $set: { 
            username: tequilaResponse.user,
            emails: [tequilaResponse.email]
          }
        }
      );
      return tequilaResponse.uniqueid
    }; 
  }

  // Global API configuration
  let Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true
  });

  // Maps to: /api/sites
  Api.addRoute('sites', {authRequired: false}, {
    get: function () {
      return Sites.find({}).fetch();
    }
  });

  // Maps to: /api/sites/:id
  Api.addRoute('sites/:id', {authRequired: false}, {
    get: function () {
      return Sites.findOne(this.urlParams.id);
    }
  });

  // Maps to: /api/sites/wp-admin/:sciper
  Api.addRoute('sites/wp-admin/:sciper', {authRequired: false}, {
    get: function()  {
      
      // Get units of sciper 
      let units = getUnits(this.urlParams.sciper);
      
      // Get all sites whose unit is present in 'units' 
      let sites = Sites.find({unitId: { $in: units }}).fetch();

      // Create an array with only wp-admin URL 
      admins = [];
      for (let index in sites) {
        admins.push(sites[index].url + '/wp-admin');
      };

      return admins;
    }
  });
}
