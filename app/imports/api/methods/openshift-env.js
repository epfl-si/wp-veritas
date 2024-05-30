import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { OpenshiftEnvs, openshiftEnvsSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin } from "./role";

const checkUniqueOpenshiftEnvName = async (openshiftEnv) => {
  if (await OpenshiftEnvs.find({ name: openshiftEnv.name }).countAsync() > 0) {
    throwMeteorError("name", "Cet environnement openshift existe déjà !");
  }
};

const insertOpenshiftEnv = new VeritasValidatedMethod({
  name: "insertOpenshiftEnv",
  role: Admin,
  async validate(newOpenshiftEnv) {
    await checkUniqueOpenshiftEnvName(newOpenshiftEnv);
    openshiftEnvsSchema.validate(newOpenshiftEnv);
  },
  async run(newOpenshiftEnv) {
    let openshiftEnvDocument = {
      name: newOpenshiftEnv.name,
    };

    let newOpenshiftEnvId = await OpenshiftEnvs.insertAsync(openshiftEnvDocument);
    let newOpenshiftEnvAfterInsert = await OpenshiftEnvs.findOneAsync({
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
  async run({ openshiftEnvId }) {
    let openshiftEnv = await OpenshiftEnvs.findOneAsync({ _id: openshiftEnvId });
    await OpenshiftEnvs.removeAsync({ _id: openshiftEnvId });

    AppLogger.getLog().info(
      `Delete openshiftEnv ID ${openshiftEnvId}`,
      { before: openshiftEnv, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertOpenshiftEnv, removeOpenshiftEnv]);

export { insertOpenshiftEnv, removeOpenshiftEnv };
