import assert from "assert";
import { Themes } from "../../collections";
import { insertTheme, removeTheme } from "../themes";
import { createUser } from "../../../../tests/helpers";
import { setupRoles } from "../../../../server/roles";
import { resetDatabase } from "../../../../server/fixtures-test";

if (Meteor.isServer) {
  describe("meteor methods theme", function () {
    before(async function () {
      await resetDatabase();
      await setupRoles();
    });

    it("insert theme", async () => {
      let userId = await createUser();

      const context = { userId };
      const args = { 
        name: "Triton alpestre en montagne"
      };

      await insertTheme._execute(context, args);

      let nb = await Themes.find({}).countAsync();
      let theme = await Themes.findOneAsync({ name: "Triton alpestre en montagne" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(theme.name, "Triton alpestre en montagne");
    });

    it("remove theme", async () => {
      let userId = await createUser();
      let theme = await Themes.findOneAsync({ name: "Triton alpestre en montagne" });

      const context = { userId };
      const args = { themeId: theme._id };

      let nbBefore = await Themes.find({}).countAsync();
      assert.strictEqual(nbBefore, 1);

      await removeTheme._execute(context, args);

      let nbAfter = await Themes.find({}).countAsync();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
