import { Meteor } from 'meteor/meteor';
import { Sites, OpenshiftEnvs, Types, Themes } from '../imports/api/collections';
import '../imports/ui/accounts-config';
import { WebApp } from 'meteor/webapp';
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

Meteor.startup(() => {
  // code to run on server at startup
});



