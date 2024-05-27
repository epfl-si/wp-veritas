import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { OpenshiftEnvs, openshiftEnvsSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin } from "./role";

const checkUniqueOpenshiftEnvName = (openshiftEnv) => {
  if (OpenshiftEnvs.find({ name: openshiftEnv.name }).count() > 0) {
    throwMeteorError("name", "Cet environnement openshift existe déjà !");
  }
};

const insertOpenshiftEnv = new VeritasValidatedMethod({
  name: "insertOpenshiftEnv",
  role: Admin,
  validate(newOpenshiftEnv) {
    checkUniqueOpenshiftEnvName(newOpenshiftEnv);
    openshiftEnvsSchema.validate(newOpenshiftEnv);
  },
  run(newOpenshiftEnv) {
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

const removeOpenshiftEnv = new VeritasValidatedMethod({
  name: "removeOpenshiftEnv",
  role: Admin,
  validate: new SimpleSchema({
    openshiftEnvId: { type: String },
  }).validator(),
  run({ openshiftEnvId }) {
    let openshiftEnv = OpenshiftEnvs.findOne({ _id: openshiftEnvId });
    OpenshiftEnvs.remove({ _id: openshiftEnvId });

    AppLogger.getLog().info(
      `Delete openshiftEnv ID ${openshiftEnvId}`,
      { before: openshiftEnv, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertOpenshiftEnv, removeOpenshiftEnv]);

export { insertOpenshiftEnv, removeOpenshiftEnv };
