import { Sites } from "../../../imports/api/collections";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { loadFixtures } from "../../fixtures";
import { loadTestFixtures } from "../../fixtures-test";
import { endpointSites } from "./api-sites.test";

if (Meteor.isServer) {
  describe("API ", () => {
    before(() => {
      resetDatabase();
      loadFixtures();
      loadTestFixtures();
    });

    // Thanks to https://www.alxolr.com/articles/how-to-separate-mocha-tests-in-multiple-files
    describe("api /sites", endpointSites.bind(this));
  });
}
