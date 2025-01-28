import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { PlatformTargets, platformTargetsSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin } from "./role";

const checkUniquePlatformTargetName = async (platformTarget) => {
  if (await PlatformTargets.find({ name: platformTarget.name }).countAsync() > 0) {
    throwMeteorError("name", "Nom de la plateforme cible existe déjà !");
  }
};

const insertPlatformTarget = new VeritasValidatedMethod({
  name: "insertPlatformTarget",
  role: Admin,
  async validate(newPlatformTarget) {
    await checkUniquePlatformTargetName(newPlatformTarget);
    platformTargetsSchema.validate(newPlatformTarget);
  },
  async run(newPlatformTarget) {
    let platformTargetDocument = {
      name: newPlatformTarget.name,
    };

    let newPlatformTargetId = await PlatformTargets.insertAsync(platformTargetDocument);
    let newPlatformTargetAfterInsert = await PlatformTargets.findOneAsync({ _id: newPlatformTargetId });

    AppLogger.getLog().info(
      `Insert platformTarget ID ${newPlatformTargetId}`,
      { before: "", after: newPlatformTargetAfterInsert },
      this.userId
    );

    return newPlatformTargetAfterInsert;
  },
});

const removePlatformTarget = new VeritasValidatedMethod({
  name: "removePlatformTarget",
  role: Admin,
  validate: new SimpleSchema({
    platformTargetId: { type: String },
  }).validator(),
  async run({ platformTargetId }) {
    let platformTarget = await PlatformTargets.findOneAsync({ _id: platformTargetId });
    await PlatformTargets.removeAsync({ _id: platformTargetId });

    AppLogger.getLog().info(
      `Delete platformTarget ID ${platformTargetId}`,
      { before: platformTarget, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertPlatformTarget, removePlatformTarget]);

export { insertPlatformTarget, removePlatformTarget };
