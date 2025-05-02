import { loadFixtures } from "../../fixtures";
import { resetDatabase, loadTestFixtures } from "../../fixtures-test";

import { endpointSites } from "./api-sites.test";
import { endpointCategories } from "./api-categories.test";
import { endpointTags } from "./api-tags.test";
import { endpointOpenshiftEnvs } from "./api-openshiftenvs.test";

if (Meteor.isServer) {
  describe("API", () => {
    before(async () => {
      console.log("    …reseting database");
      await resetDatabase();
      await loadFixtures();
      await loadTestFixtures();
    });

    // Thanks to https://www.alxolr.com/articles/how-to-separate-mocha-tests-in-multiple-files
    describe("API's endpoint: /sites", endpointSites.bind(this));
    describe("API's endpoint: /categories", endpointCategories.bind(this));
    describe("API's endpoint: /tags", endpointTags.bind(this));
    describe("API's endpoint: /openshiftenvs", endpointOpenshiftEnvs.bind(this));
  });
}
