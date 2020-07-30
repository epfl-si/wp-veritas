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

createTag = (userId, args) => {
  const context = { userId };
  idTag = insertTag._execute(context, args);
  return Tags.findOne({ _id: idTag });
};

loadCategoriesFixtures = () => {
  Categories.insert({
    name: "Inside",
  });

  Categories.insert({
    name: "Restauration",
  });
};

loadTagsFixtures = () => {
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

loadProfessorsFixtures = () => {
  let userId = createUser();

  const context = { userId };
  const args = {
    sciper: "188475",
    displayName: "Charmier Grégory",
  };

  insertProfessor._execute(context, args);

  Professors.findOne({ sciper: "188475" });
};

loadSitesFixtures = () => {
  let userId = createUser();
  let tags = Tags.find({}).fetch();
  let categories = Categories.find({ name: "Restauration" }).fetch();
  let professors = Professors.find({ sciper: "188475" }).fetch();

  // Create site with this professor
  createSite(userId, categories, tags, professors);
};

loadTestFixtures = () => {
  if (Categories.find({}).count() == 0) {
    console.log("    …importing categories");
    loadCategoriesFixtures();
  } else {
    console.log("Categories already exist");
  }

  if (Tags.find({}).count() == 0) {
    console.log("    …importing tags");
    loadTagsFixtures();
  } else {
    console.log("Tags already exist");
  }

  if (Professors.find({}).count() == 0) {
    console.log("    …importing professors");
    loadProfessorsFixtures();
  } else {
    console.log("Professors already exist");
  }

  if (Sites.find({}).count() == 0) {
    console.log("    …importing sites");
    loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

export { loadTestFixtures };
