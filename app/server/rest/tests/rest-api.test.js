import { setupRoles } from "../../roles";
import { resetDatabase, loadTestFixtures } from "../../fixtures-test";

import { endpointSites } from "./api-sites.test";
import { endpointTags } from "./api-tags.test";

if (Meteor.isServer) {
  describe("API", () => {
    before(async () => {
      console.log("    …reseting database");
      await resetDatabase();
      await setupRoles();
      await loadTestFixtures();
    });

    // Thanks to https://www.alxolr.com/articles/how-to-separate-mocha-tests-in-multiple-files
    describe("API's endpoint: /sites", endpointSites.bind(this));
    describe("API's endpoint: /tags", endpointTags.bind(this));
  });
}
