import assert from "assert";
import { Tags } from "../../collections";
import { insertTag, updateTag, removeTag } from "../tags";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";
import { createSite, getSitesByTag } from "./helpers";

if (Meteor.isServer) {
  describe("meteor methods tag", function () {
    before(function () {
      resetDatabase();
    });

    it("insert tag", () => {
      let userId = createUser();

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

      insertTag._execute(context, args);

      let nb = Tags.find({}).count();
      let tag = Tags.findOne({ name_en: "Algebra" });

      // Create site with this tag
      createSite(userId, [tag], []);

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

    it("update tag", () => {
      let userId = createUser();
      let tag = Tags.findOne({ name_en: "Algebra" });

      let site = getSitesByTag(tag)[0];
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

      updateTag._execute(context, args);

      let nb = Tags.find({}).count();
      let tagAfterUpdate = Tags.findOne({ _id: tag._id });

      assert.strictEqual(nb, 1);
      assert.strictEqual(tagAfterUpdate.name_fr, "Mathématiques");
      assert.strictEqual(tagAfterUpdate.name_en, "Maths");

      let siteAfterUpdate = getSitesByTag(tag)[0];
      assert.strictEqual(siteAfterUpdate.tags[0].name_en, "Maths");
    });

    it("remove tag", () => {
      let userId = createUser();
      let tag = Tags.findOne({ name_en: "Maths" });

      const context = { userId };
      const args = { tagId: tag._id };

      let nbBefore = Tags.find({}).count();
      assert.strictEqual(nbBefore, 1);

      let siteNumbersBefore = getSitesByTag(tag).length;
      assert.strictEqual(siteNumbersBefore, 1);

      removeTag._execute(context, args);

      let siteNumbersAfter = getSitesByTag(tag).length;
      assert.strictEqual(siteNumbersAfter, 0);

      let nbAfter = Tags.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
