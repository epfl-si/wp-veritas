import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Sites } from '../imports/api/sites';
 
//import App from '../imports/ui/App.js';
import App from './App';
 
Meteor.startup(() => {
  render(<App />, document.getElementById('render-target'));
});

if (Meteor.isDevelopment) {
  window.Sites = Sites;
}