import Tequila from "meteor/epfl:accounts-tequila";
import React from "react";
import { Meteor } from "meteor/meteor";
import { render } from "react-dom";
import { Sites, Themes } from "../imports/api/collections";
import App from "../imports/ui/App";

Meteor.startup(() => {
  render(<App />, document.getElementById("render-target"));
  Tequila.start();
});

if (Meteor.isDevelopment) {
  window.Sites = Sites;
  window.Themes = Themes;
  window.Users = Meteor.users;
}
