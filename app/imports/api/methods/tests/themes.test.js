import assert from "assert";
import { Themes } from "../../collections";
import { insertTheme, removeTheme } from "../themes";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";

if (Meteor.isServer) {
  describe("meteor methods theme", function () {
    before(function () {
      resetDatabase();
    });

    it("insert theme", () => {
      let userId = createUser();

      const context = { userId };
      const args = { 
        name: "Triton alpestre en montagne"
      };

      insertTheme._execute(context, args);

      let nb = Themes.find({}).count();
      let theme = Themes.findOne({ name: "Triton alpestre en montagne" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(theme.name, "Triton alpestre en montagne");
    });

    it("remove theme", () => {
      let userId = createUser();
      let theme = Themes.findOne({ name: "Triton alpestre en montagne" });

      const context = { userId };
      const args = { themeId: theme._id };

      let nbBefore = Themes.find({}).count();
      assert.strictEqual(nbBefore, 1);

      removeTheme._execute(context, args);

      let nbAfter = Themes.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
