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

const createTag = (userId, args) => {
  const context = { userId };
  idTag = insertTag._execute(context, args);
  return Tags.findOne({ _id: idTag });
};

const loadCategoriesFixtures = () => {
  Categories.insert({
    name: "Inside",
  });

  Categories.insert({
    name: "Restauration",
  });
};

const loadTagsFixtures = () => {
  let userId = createUser();

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

  createTag(userId, tagArgs1);
  createTag(userId, tagArgs2);
};

const loadProfessorsFixtures = () => {
  let userId = createUser();

  const context = { userId };
  const args = {
    sciper: "188475",
    displayName: "Charmier Grégory",
  };

  insertProfessor._execute(context, args);

  Professors.findOne({ sciper: "188475" });
};

const loadSitesFixtures = async () => {
  let userId = createUser();
  let tags = await Tags.find({}).fetchAsync();
  let categories = await Categories.find({ name: "Restauration" }).fetchAsync();
  let professors = await Professors.find({ sciper: "188475" }).fetchAsync();

  // Create site with this professor
  createSite(userId, categories, tags, professors);
};

const loadTestFixtures = async () => {
  if ((await Categories.find({}).countAsync()) == 0) {
    console.log("    …importing categories");
    loadCategoriesFixtures();
  } else {
    console.log("Categories already exist");
  }

  if ((await Tags.find({}).countAsync()) == 0) {
    console.log("    …importing tags");
    loadTagsFixtures();
  } else {
    console.log("Tags already exist");
  }

  if ((await Professors.find({}).countAsync()) == 0) {
    console.log("    …importing professors");
    loadProfessorsFixtures();
  } else {
    console.log("Professors already exist");
  }

  if ((await Sites.find({}).countAsync()) == 0) {
    console.log("    …importing sites");
    loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

export { loadTestFixtures };
