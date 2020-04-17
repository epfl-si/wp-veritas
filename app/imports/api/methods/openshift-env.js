import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { OpenshiftEnvs, openshiftEnvsSchema } from "../collections";
import { checkUserAndRole } from "./utils";
import { AppLogger } from "../logger";

checkUniqueName = (openshiftEnv) => {
  if (OpenshiftEnvs.find({ name: openshiftEnv.name }).count() > 0) {
    throwMeteorError("name", "Cet environnement openshift existe déjà !");
  }
};

const insertOpenshiftEnv = new ValidatedMethod({
  name: "insertOpenshiftEnv",
  validate(newOpenshiftEnv) {
    checkUniqueName(newOpenshiftEnv);
    openshiftEnvsSchema.validate(newOpenshiftEnv);
  },
  run(newOpenshiftEnv) {
    checkUserAndRole(
      this.userId,
      ["admin"],
      "Only admins can insert openShiftEnv."
    );

    let openshiftEnvDocument = {
      name: newOpenshiftEnv.name,
    };

    let newOpenshiftEnvId = OpenshiftEnvs.insert(openshiftEnvDocument);
    let newOpenshiftEnvAfterInsert = OpenshiftEnvs.findOne({
      _id: newOpenshiftEnvId,
    });

    AppLogger.getLog().info(
      `Insert openshiftEnvs ID ${newOpenshiftEnvId}`,
      { before: "", after: newOpenshiftEnvAfterInsert },
      this.userId
    );

    return newOpenshiftEnvId;
  },
});

const removeOpenshiftEnv = new ValidatedMethod({
  name: "removeOpenshiftEnv",
  validate: new SimpleSchema({
    openshiftEnvId: { type: String },
  }).validator(),
  run({ openshiftEnvId }) {
    checkUserAndRole(
      this.userId,
      ["admin"],
      "Only admins can remove openShiftEnv."
    );

    let openshiftEnv = OpenshiftEnvs.findOne({ _id: openshiftEnvId });
    OpenshiftEnvs.remove({ _id: openshiftEnvId });

    AppLogger.getLog().info(
      `Delete openshiftEnv ID ${openshiftEnvId}`,
      { before: openshiftEnv, after: "" },
      this.userId
    );
  },
});

export { insertOpenshiftEnv, removeOpenshiftEnv };
