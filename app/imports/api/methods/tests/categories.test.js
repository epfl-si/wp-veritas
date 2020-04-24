import assert from "assert";
import { Categories } from "../../collections";
import { insertCategory, removeCategory } from "../categories";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";

if (Meteor.isServer) {
  describe("meteor methods category", function () {
    before(function () {
      resetDatabase();
    });

    it("insert category", () => {
      let userId = createUser();

      // Set up method arguments and context
      const context = { userId };
      const args = { name: "Super nouvelle catégorie" };

      insertCategory._execute(context, args);

      let nb = Categories.find({}).count();
      let category = Categories.findOne({ name: "Super nouvelle catégorie" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(category.name, "Super nouvelle catégorie");
    });

    it("remove category", () => {
      let userId = createUser();
      let category = Categories.findOne({ name: "Super nouvelle catégorie" });

      const context = { userId };
      const args = { categoryId: category._id };

      let nbBefore = Categories.find({}).count();
      assert.strictEqual(nbBefore, 1);

      removeCategory._execute(context, args);

      let nbAfter = Categories.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
