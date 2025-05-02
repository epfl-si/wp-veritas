import assert from "assert";
import { Sites, Tags, Categories } from "../../collections";
import { insertSite, updateSite, removeSite } from "../sites";
import { insertTag } from "../tags";
import { createUser } from "../../../../tests/helpers";
import { loadFixtures } from "../../../../server/fixtures";
import { resetDatabase } from "../../../../server/fixtures-test";

async function createTag(userId, args) {
  const context = { userId };
  const idTag = await insertTag._execute(context, args);
  return await Tags.findOneAsync({_id: idTag});
}

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

      let tag1 = await createTag(userId, tagArgs1);
      let tag2 = await createTag(userId, tagArgs2);

      let tagsNumber = await Tags.find({}).countAsync();
      assert.strictEqual(tagsNumber, 2);

      const url = "https://www.epfl.ch/beaujolais/madame-placard/";
      const title = "Ma meilleure découverte 2019";

      const context = { userId };
      const args = {
        url: url,
        tagline: "Yvon Métras",
        title: title,
        openshiftEnv: "www",
        categories: await Categories.find({ name: "epfl-menus" }).fetchAsync(),
        theme: "wp-theme-2018",
        platformTarget: "openshift-4",
        languages: ["en", "fr"],
        unitId: "13030",
        snowNumber: "42",
        comment: "Vin nature par excellence !",
        createdDate: new Date(),
        monitorSite: false,
        tags: [tag1, tag2],
        professors: [],
        wpInfra: true,
        isDeleted: false
      };

      await insertSite._execute(context, args);

      let sitesNumber = await Sites.find({}).countAsync();
      let site = await Sites.findOneAsync({ url: url });

      assert.strictEqual(site.categories.length, 1);
      assert.strictEqual(site.categories[0].name, "epfl-menus");

      assert.strictEqual(sitesNumber, 1);
      assert.strictEqual(site.title, title);
    });

    it("update site", async () => {
      let userId = await createUser();
      const url = "https://www.epfl.ch/beaujolais/madame-placard/";
      const title = "Ma meilleure découverte 2019";
      let site = await Sites.findOneAsync({ url: url });

      const context = { userId };
      const args = {
        _id: site._id,
        url: url,
        tagline: site.tagline,
        title: title,
        openshiftEnv: "www",
        categories: await Categories.find({ name: "epfl-menus" }).fetchAsync(),
        theme: "wp-theme-2018",
        platformTarget: "openshift-4",
        languages: ["en", "fr"],
        unitId: "13030",
        snowNumber: "42",
        comment: "Vin nature par excellence !",
        createdDate: new Date(),
        monitorSite: false,
        tags: [],
        professors: [],
        wpInfra: true,
        isDeleted: false
      };

      await updateSite._execute(context, args);

      let nb = await Sites.find({}).countAsync();
      let siteAfterUpdate = await Sites.findOneAsync({ _id: site._id });

      assert.strictEqual(nb, 1);
      assert.strictEqual(siteAfterUpdate.tagline, "Yvon Métras");
      assert.strictEqual(siteAfterUpdate.title, title);

      assert.strictEqual(site.categories.length, 1);
      assert.strictEqual(site.categories[0].name, "epfl-menus");
    });

    it("remove site", async () => {
      let userId = await createUser();
      const url = "https://www.epfl.ch/beaujolais/madame-placard/";
      let site = await Sites.findOneAsync({ url: url });

      const context = { userId };
      const args = { siteId: site._id };

      let sitesNumberBeforeRemove = await Sites.find({ isDeleted: false }).countAsync();
      assert.strictEqual(sitesNumberBeforeRemove, 1);

      await removeSite._execute(context, args);

      let sitesNumberAfterRemove = await Sites.find({ isDeleted: false }).countAsync();
      assert.strictEqual(sitesNumberAfterRemove, 0);
    });
  });
}
