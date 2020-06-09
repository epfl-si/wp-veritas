import Tequila from "meteor/epfl:accounts-tequila";
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Sites, OpenshiftEnvs, Themes } from '../imports/api/collections';
import AppContainer from '../imports/ui/containers/AppContainer';
 
Meteor.startup(() => {
  render(<AppContainer />, document.getElementById('render-target'));
  Tequila.start();
});

if (Meteor.isDevelopment) {
  window.Sites = Sites;
  window.OpenshiftEnvs = OpenshiftEnvs;
  window.Themes = Themes;
  window.Users = Meteor.users;
}
