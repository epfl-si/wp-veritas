import assert from "assert";
import { OpenshiftEnvs } from "../../collections";
import { insertOpenshiftEnv, removeOpenshiftEnv } from "../openshift-env";
import { createUser } from "../../../../tests/helpers";
import { loadFixtures } from "../../../../server/fixtures";
import { resetDatabase } from "../../../../server/fixtures-test";

if (Meteor.isServer) {
  describe("meteor methods openshiftEnv", function () {
    before(async function () {
      await resetDatabase();
      await loadFixtures();
    });

    it("insert openshiftEnv", async () => {
      let userId = await createUser();

      // Set up method arguments and context
      const context = { userId };
      const args = { name: "www" };

      await insertOpenshiftEnv._execute(context, args);

      let nb = await OpenshiftEnvs.find({}).countAsync();
      let openshiftEnv = await OpenshiftEnvs.findOneAsync({ name: "www" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(openshiftEnv.name, "www");
    });

    it("remove openshiftEnv", async () => {
      let userId = await createUser();
      let openshiftEnv = await OpenshiftEnvs.findOneAsync({ name: "www" });

      const context = { userId };
      const args = { openshiftEnvId: openshiftEnv._id };

      let nbBefore = await OpenshiftEnvs.find({}).countAsync();
      assert.strictEqual(nbBefore, 1);

      await removeOpenshiftEnv._execute(context, args);

      let nbAfter = await OpenshiftEnvs.find({}).countAsync();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
