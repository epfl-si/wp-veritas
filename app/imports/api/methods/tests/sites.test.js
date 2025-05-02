import assert from "assert";
import { Sites, Categories } from "../../collections";
import { insertSite, updateSite, removeSite } from "../sites";
import { insertTag } from "../tags";
import { createUser } from "../../../../tests/helpers";
import { loadFixtures } from "../../../../server/fixtures";
import { resetDatabase } from "../../../../server/fixtures-test";

if (Meteor.isServer) {
  describe("meteor methods site", function () {
    before(async function () {
      await resetDatabase();
      await loadFixtures();
      await Categories.insertAsync({
        name: "Inside",
      });
      await Categories.insertAsync({
        name: "epfl-menus",
      });
    });

    it("insert site", async () => {
      let userId = await createUser();

      const tagArgs1 = {
        name_fr: "Beaujolais",
        name_en: "Beaujolais",
        url_fr: "https://fr.wikipedia.org/wiki/Beaujolais",
        url_en: "https://en.wikipedia.org/wiki/Beaujolais",
        type: "field-of-research",
      };

      const tagArgs2 = {
        name_fr: "Vin nature",
        name_en: "Nature wine",
        url_fr: "https://fr.wikipedia.org/wiki/Vin_naturel",
        url_en: "https://en.wikipedia.org/wiki/Natural_wine",
        type: "field-of-research",
      };

      const url = "https://www.epfl.ch/beaujolais/madame-placard/";
      const title = "Ma meilleure découverte 2019";

      const context = { userId };
      const args = {
        url: url,
        type: "external",
        unitId: 13030,
        snowNumber: "42",
        comment: "Vin nature par excellence !",
        createdDate: new Date().toString(),
        monitorSite: false,
      };

      await insertSite._execute(context, args);

      let sitesNumber = await Sites.find({}).countAsync();
      let site = await Sites.findOneAsync({ url: url });

      assert.strictEqual(sitesNumber, 1);
    });

    it("update site", async () => {
      let userId = await createUser();
      const url = "https://www.epfl.ch/beaujolais/madame-placard/";
      let site = await Sites.findOneAsync({ url: url });

      const context = { userId };
      const args = {
        _id: site._id,
        url: url,
        type: "external",
        unitId: 13030,
        snowNumber: "42",
        comment: "Vin nature par excellence !",
        createdDate: new Date().toString(),
        monitorSite: false,
      };

      await updateSite._execute(context, args);

      let nb = await Sites.find({}).countAsync();
      let siteAfterUpdate = await Sites.findOneAsync({ _id: site._id });

      assert.strictEqual(nb, 1);
    });

    it("remove site", async () => {
      let userId = await createUser();
      const url = "https://www.epfl.ch/beaujolais/madame-placard/";
      let site = await Sites.findOneAsync({ url: url });

      const context = { userId };
      const args = { url: site.url };

      let sitesNumberBeforeRemove = await Sites.find().countAsync();
      assert.strictEqual(sitesNumberBeforeRemove, 1);

      await removeSite._execute(context, args);

      let sitesNumberAfterRemove = await Sites.find().countAsync();
      assert.strictEqual(sitesNumberAfterRemove, 0);
    });
  });
}
