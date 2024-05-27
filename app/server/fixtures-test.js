import {
  Sites,
  Tags,
  Categories,
  Professors,
} from "../imports/api/collections";
import { createUser } from "../tests/helpers";
import { insertTag } from "../imports/api/methods/tags";
import { insertProfessor } from "../imports/api/methods/professors";
import { createSite } from "../imports/api/methods/tests/helpers";

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
    name: "Restauration",
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

const loadProfessorsFixtures = async () => {
  let userId = await createUser();

  const context = { userId };
  const args = {
    sciper: "188475",
    displayName: "Charmier Grégory",
  };

  await insertProfessor._execute(context, args);

  await Professors.findOneAsync({ sciper: "188475" });
};

const loadSitesFixtures = async () => {
  let userId = await createUser();
  let tags = await Tags.find({}).fetchAsync();
  let categories = await Categories.find({ name: "Restauration" }).fetchAsync();
  let professors = await Professors.find({ sciper: "188475" }).fetchAsync();

  // Create site with this professor
  await createSite(userId, categories, tags, professors);
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

  if ((await Professors.find({}).countAsync()) == 0) {
    console.log("    …importing professors");
    await loadProfessorsFixtures();
  } else {
    console.log("Professors already exist");
  }

  if ((await Sites.find({}).countAsync()) == 0) {
    console.log("    …importing sites");
    await loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

export { loadTestFixtures };
