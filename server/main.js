import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// In order to debug collections inside browser
import { Sites } from '../both';
import './publications';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

if (Meteor.isServer) {

  // Global API configuration
  var Api = new Restivus({
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

Meteor.startup(() => {
  // code to run on server at startup
});
