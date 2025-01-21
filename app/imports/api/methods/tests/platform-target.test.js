import assert from "assert";
import { PlatformTargets } from "../../collections";
import { insertPlatformTarget, removePlatformTarget } from "../platform-target";
import { createUser } from "../../../../tests/helpers";
import { loadFixtures } from "../../../../server/fixtures";
import { resetDatabase } from "../../../../server/fixtures-test";

if (Meteor.isServer) {
  describe("meteor methods platformTarget", function () {
    before(async function () {
      await resetDatabase();
      await loadFixtures();
    });

    it("insert platformTarget", async () => {
      let userId = await createUser();

      const context = { userId };
      const args = {
        name: "OpenShift 4"
      };

      await insertPlatformTarget._execute(context, args);

      let nb = await PlatformTargets.find({}).countAsync();
      let platformTarget = await PlatformTargets.findOneAsync({ name: "OpenShift 4" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(platformTarget.name, "OpenShift 4");
    });

    it("remove platformTarget", async () => {
      let userId = await createUser();
      let platformTarget = await PlatformTargets.findOneAsync({ name: "OpenShift 4" });

      const context = { userId };
      const args = { platformTargetId: platformTarget._id };

      let nbBefore = await PlatformTargets.find({}).countAsync();
      assert.strictEqual(nbBefore, 1);

      await removePlatformTarget._execute(context, args);

      let nbAfter = await PlatformTargets.find({}).countAsync();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
