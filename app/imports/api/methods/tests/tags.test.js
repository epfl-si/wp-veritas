import assert from "assert";
import { Tags } from "../../collections";
import { insertTag, updateTag, removeTag } from "../tags";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";

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
        url_fr: "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        url_en: "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        type: "field-of-research",
      };

      insertTag._execute(context, args);

      let nb = Tags.find({}).count();
      let tag = Tags.findOne({ name_en: "Algebra" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(tag.name_fr, "Algèbre");
      assert.strictEqual(tag.url_fr, "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory");
      assert.strictEqual(tag.url_en, "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory");
      assert.strictEqual(tag.type, "field-of-research");
    });

    it("update tag", () => {
      let userId = createUser();
      let tag = Tags.findOne({ name_en: "Algebra" });

      const context = { userId };
      const args = { 
        _id: tag._id,
        name_fr: "Mathématiques",
        name_en: "Maths",
        url_fr: "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        url_en: "https://www.epfl.ch/research/domains/cluster/?field-of-research=Algebra%20and%20number%20theory",
        type: "field-of-research",
      };

      updateTag._execute(context, args);

      let nb = Tags.find({}).count();
      let tagAfterUpdate = Tags.findOne({ _id: tag._id });

      assert.strictEqual(nb, 1);
      assert.strictEqual(tagAfterUpdate.name_fr, "Mathématiques");
      assert.strictEqual(tagAfterUpdate.name_en, "Maths");
      
    });

    it("remove tag", () => {
      let userId = createUser();
      let tag = Tags.findOne({ name_en: "Maths" });

      const context = { userId };
      const args = { tagId: tag._id };

      let nbBefore = Tags.find({}).count();
      assert.strictEqual(nbBefore, 1);

      removeTag._execute(context, args);

      let nbAfter = Tags.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
