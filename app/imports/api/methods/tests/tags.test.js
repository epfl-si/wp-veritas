import assert from "assert";
import { Tags } from "../../collections";
import { insertTag, updateTag, removeTag } from "../tags";
import { createUser } from "../../../../tests/helpers";
import { createSite, getSitesByTag } from "./helpers";
import { loadFixtures } from "../../../../server/fixtures";
import { resetDatabase } from "../../../../server/fixtures-test";

if (Meteor.isServer) {
  describe("meteor methods tag", function () {
    before(async function () {
      await resetDatabase();
      await loadFixtures();
    });

    it("insert tag", async () => {
      let userId = await createUser();

      const context = { userId };
      const args = {
        name_fr: "Algèbre",
        name_en: "Algebra",
        url_fr:
          "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        url_en:
          "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        type: "field-of-research",
      };

      await insertTag._execute(context, args);

      let nb = await Tags.find({}).countAsync();
      let tag = await Tags.findOneAsync({ name_en: "Algebra" });
    
      // Create site with this tag
      await createSite(userId, [], [tag], []);

      assert.strictEqual(nb, 1);
      assert.strictEqual(tag.name_fr, "Algèbre");
      assert.strictEqual(
        tag.url_fr,
        "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory"
      );
      assert.strictEqual(
        tag.url_en,
        "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory"
      );
      assert.strictEqual(tag.type, "field-of-research");
    });

    it("update tag", async () => {
      let userId = await createUser();
      let tag = await Tags.findOneAsync({ name_en: "Algebra" });

      let site = (await getSitesByTag(tag))[0];
      assert.strictEqual(site.tags[0].name_en, "Algebra");

      const context = { userId };
      const args = {
        _id: tag._id,
        name_fr: "Mathématiques",
        name_en: "Maths",
        url_fr:
          "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        url_en:
          "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        type: "field-of-research",
      };

      await updateTag._execute(context, args);

      let nb = await Tags.find({}).countAsync();
      let tagAfterUpdate = await Tags.findOneAsync({ _id: tag._id });

      assert.strictEqual(nb, 1);
      assert.strictEqual(tagAfterUpdate.name_fr, "Mathématiques");
      assert.strictEqual(tagAfterUpdate.name_en, "Maths");

      let siteAfterUpdate = (await getSitesByTag(tag))[0];
      assert.strictEqual(siteAfterUpdate.tags[0].name_en, "Maths");
    });

    it("remove tag", async () => {
      let userId = await createUser();
      let tag = await Tags.findOneAsync({ name_en: "Maths" });

      const context = { userId };
      const args = { tagId: tag._id };

      let nbBefore = await Tags.find({}).countAsync();
      assert.strictEqual(nbBefore, 1);

      let siteNumbersBefore = (await getSitesByTag(tag)).length;
      assert.strictEqual(siteNumbersBefore, 1);

      await removeTag._execute(context, args);

      let siteNumbersAfter = (await getSitesByTag(tag)).length;
      assert.strictEqual(siteNumbersAfter, 0);

      let nbAfter = await Tags.find({}).countAsync();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
