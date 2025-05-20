import {
  Sites,
  Themes,
  Tags,
  AppLogs,
} from "../imports/api/collections";
import { createUser } from "../tests/helpers";
import { createSite } from "../imports/api/methods/tests/helpers";
import Meteor from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import MongoInternals from "meteor/mongo";

const loadSitesFixtures = async () => {
  let userId = await createUser();
  await createSite(userId);
};

const loadTestFixtures = async () => {
  if ((await Sites.find({}).countAsync()) == 0) {
    console.log("    …importing sites");
    await loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

async function resetDatabase () {
  for (const c of [Sites, Themes, Tags, AppLogs]) {
    await c.dropCollectionAsync();
  }
}

export { loadTestFixtures, resetDatabase };
