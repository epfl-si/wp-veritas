import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Sites, OpenshiftEnvs, Types, Themes } from '../imports/api/collections';
import App from '../imports/ui/App';
 
Meteor.startup(() => {
  render(<App />, document.getElementById('render-target'));
});

if (Meteor.isDevelopment) {
  window.Sites = Sites;
  window.OpenshiftEnvs = OpenshiftEnvs;
  window.Types = Types;
  window.Themes = Themes;
}
