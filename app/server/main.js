import helmet from "helmet";
import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";
import { setupRoles } from "./roles";

import "./publications"; // Call meteor publications backend
import "../imports/api/methods/tags";
import "../imports/api/methods/themes";
import "../imports/api/methods/sites";

import { AppLogger } from "../imports/api/logger";
import { loadData } from "./load-value";

import { getEnvironment } from "../imports/api/utils";

let importDatas = false;

// Warning: Tequila is needed to create the DB entries the first time that
// you run the app — afterwards you can disable it to have more dev comfort.
let forceTequila = true;
let disableTequila = forceTequila === false && getEnvironment() === "LOCALHOST" ? true : false;

if (Meteor.isServer) {
  Meteor.startup(function () {
    // Define lang <html lang="fr" />
    WebApp.addHtmlAttributeHook(() => ({ lang: "fr" }));

    // https://guide.meteor.com/security.html#httpheaders
    WebApp.connectHandlers.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["*"],
          imgSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
        browserSniff: false,
      })
    );

    // Setting up logs
    new AppLogger();

    if (importDatas) {
      importData();
    }

    setupRoles();
    loadData();

    if (!disableTequila) {
      import "./tequila-config";
    }
    // Import each REST API endpoint in turn, to register them
    import "./rest/sites";
    import "./rest/tags";
  });
}
