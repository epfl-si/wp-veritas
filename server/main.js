import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// In order to debug collections inside browser
import { Sites, OpenshiftEnvs, Types, Themes } from '../imports/api/collections';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

Meteor.startup(() => {
  // code to run on server at startup
});



