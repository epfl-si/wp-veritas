import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// In order to debug collections inside browser
import { Sites } from '../imports/api/collections';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

if (Meteor.isServer) {

  // Global API configuration
  var Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true
  });

  // Maps to: /api/articles/:id
  Api.addRoute('sites', {authRequired: false}, {
    get: function () {
      return Sites.find({}).fetch();
    }
  });

  // Maps to: /api/articles/:id
  Api.addRoute('sites/:id', {authRequired: false}, {
    get: function () {
      return Sites.findOne(this.urlParams.id);
    }
  });
}


Meteor.startup(() => {
  // code to run on server at startup
});



