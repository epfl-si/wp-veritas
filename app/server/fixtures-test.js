import {
  Sites,
  Categories,
  Themes,
  Tags,
  AppLogs,
} from "../imports/api/collections";
import { createUser } from "../tests/helpers";
import { createSite } from "../imports/api/methods/tests/helpers";
import Meteor from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import MongoInternals from "meteor/mongo";

const loadCategoriesFixtures = async () => {
  await Categories.insertAsync({
    name: "Inside",
  });

  await Categories.insertAsync({
    name: "epfl-menus",
  });
};

const loadSitesFixtures = async () => {
  let userId = await createUser();
  let categories = await Categories.find({ name: "epfl-menus" }).fetchAsync();

  // Create site with this professor
  await createSite(userId, categories);
};

const loadTestFixtures = async () => {
  if ((await Categories.find({}).countAsync()) == 0) {
    console.log("    …importing categories");
    await loadCategoriesFixtures();
  } else {
    console.log("Categories already exist");
  }

  if ((await Sites.find({}).countAsync()) == 0) {
    console.log("    …importing sites");
    await loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

async function resetDatabase () {
  for (const c of [Sites, Categories, Themes, Tags, AppLogs]) {
    await c.dropCollectionAsync();
  }
  for (const r of await Roles.getAllRoles().fetchAsync()) {
    await Roles.deleteRoleAsync(r._id);
  }
}

export { loadTestFixtures, resetDatabase };
