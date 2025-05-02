import {
  Sites,
  OpenshiftEnvs,
  Categories,
  Themes,
  PlatformTargets,
  Tags,
  AppLogs,
} from "../imports/api/collections";
import { createUser } from "../tests/helpers";
import { insertTag } from "../imports/api/methods/tags";
import { createSite } from "../imports/api/methods/tests/helpers";
import Meteor from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import MongoInternals from "meteor/mongo";

const createTag = async (userId, args) => {
  const context = { userId };
  const idTag = await insertTag._execute(context, args);
  return await Tags.findOneAsync({ _id: idTag });
};

const loadCategoriesFixtures = async () => {
  await Categories.insertAsync({
    name: "Inside",
  });

  await Categories.insertAsync({
    name: "epfl-menus",
  });
};

const loadTagsFixtures = async () => {
  let userId = await createUser();

  const tagArgs1 = {
    name_fr: "Beaujolais",
    name_en: "Beaujolais",
    url_fr: "https://fr.wikipedia.org/wiki/Beaujolais",
    url_en: "https://en.wikipedia.org/wiki/Beaujolais",
    type: "field-of-research",
  };

  const tagArgs2 = {
    name_fr: "Vin nature",
    name_en: "Nature wine",
    url_fr: "https://fr.wikipedia.org/wiki/Vin_naturel",
    url_en: "https://en.wikipedia.org/wiki/Natural_wine",
    type: "field-of-research",
  };

  await createTag(userId, tagArgs1);
  await createTag(userId, tagArgs2);
};

const loadSitesFixtures = async () => {
  let userId = await createUser();
  let tags = await Tags.find({}).fetchAsync();
  let categories = await Categories.find({ name: "epfl-menus" }).fetchAsync();

  // Create site with this professor
  await createSite(userId, categories, tags);
};

const loadTestFixtures = async () => {
  if ((await Categories.find({}).countAsync()) == 0) {
    console.log("    …importing categories");
    await loadCategoriesFixtures();
  } else {
    console.log("Categories already exist");
  }

  if ((await Tags.find({}).countAsync()) == 0) {
    console.log("    …importing tags");
    await loadTagsFixtures();
  } else {
    console.log("Tags already exist");
  }

  if ((await Sites.find({}).countAsync()) == 0) {
    console.log("    …importing sites");
    await loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

async function resetDatabase () {
  for (const c of [Sites, OpenshiftEnvs, Categories, Themes, PlatformTargets, Tags, AppLogs]) {
    await c.dropCollectionAsync();
  }
  for (const r of await Roles.getAllRoles().fetchAsync()) {
    await Roles.deleteRoleAsync(r._id);
  }
}

export { loadTestFixtures, resetDatabase };
