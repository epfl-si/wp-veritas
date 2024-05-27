import assert from "assert";
import { Categories } from "../../collections";
import { insertCategory, removeCategory } from "../categories";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";
import { loadFixtures } from "../../../../server/fixtures";

if (Meteor.isServer) {
  describe("meteor methods category", function () {
    before(async function () {
      resetDatabase();
      await loadFixtures();
    });

    it("insert category", async () => {
      let userId = await createUser();

      // Set up method arguments and context
      const context = { userId };
      const args = { name: "Super nouvelle catégorie" };

      await insertCategory._execute(context, args);

      let nb = await Categories.find({}).countAsync();
      let category = await Categories.findOneAsync({ name: "Super nouvelle catégorie" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(category.name, "Super nouvelle catégorie");
    });

    it("remove category", async () => {
      let userId = await createUser();
      let category = await Categories.findOneAsync({ name: "Super nouvelle catégorie" });

      const context = { userId };
      const args = { categoryId: category._id };

      let nbBefore = await Categories.find({}).countAsync();
      assert.strictEqual(nbBefore, 1);

      await removeCategory._execute(context, args);

      let nbAfter = await Categories.find({}).countAsync();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
