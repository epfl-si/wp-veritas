import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Sites } from '../both';
import './publications';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

if (Meteor.isServer) {

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
}
