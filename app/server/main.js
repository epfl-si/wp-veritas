import helmet from "helmet";
import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";
import { loadFixtures } from "./fixtures";
import "./sites";

import "./publications"; // Call meteor publications backend
import "../imports/api/methods"; // Call meteor methods backend
import "../imports/api/methods/tags";
import "../imports/api/methods/themes";
import "../imports/api/methods/platform-target";
import "../imports/api/methods/professors";
import "../imports/api/methods/categories";
import "../imports/api/methods/openshift-env";
import "../imports/api/methods/sites";

import { importData } from "./import-data";
import { AppLogger } from "../imports/api/logger";

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

    loadFixtures();

    if (!disableTequila) {
      import "./tequila-config";
    }
    // Import each REST API endpoint in turn, to register them
    import "./rest/categories";
    import "./rest/professors";
    import "./rest/sites";
    import "./rest/tags";
    import "./rest/openshiftenv";
    import "./cron";

    SyncedCron.start();
  });
}
