import { resetDatabase } from "meteor/xolvio:cleaner";
import assert from "assert";
import { OpenshiftEnvs } from "../../collections";
import { insertOpenshiftEnv, removeOpenshiftEnv } from "../openshift-env";
import { createUser } from "../../../../tests/helpers";

if (Meteor.isServer) {
  describe("meteor methods openshiftEnv", function () {
    before(function () {
      resetDatabase();
    });

    it("insert openshiftEnv", () => {
      let userId = createUser();

      // Set up method arguments and context
      const context = { userId };
      const args = { name: "www" };

      insertOpenshiftEnv._execute(context, args);

      let nb = OpenshiftEnvs.find({}).count();
      let openshiftEnv = OpenshiftEnvs.findOne({ name: "www" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(openshiftEnv.name, "www");
    });

    it("remove openshiftEnv", () => {
      let userId = createUser();
      let openshiftEnv = OpenshiftEnvs.findOne({ name: "www" });

      const context = { userId };
      const args = { openshiftEnvId: openshiftEnv._id };

      let nbBefore = OpenshiftEnvs.find({}).count();
      assert.strictEqual(nbBefore, 1);

      removeOpenshiftEnv._execute(context, args);

      let nbAfter = OpenshiftEnvs.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
