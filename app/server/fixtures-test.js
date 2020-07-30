import { Sites, Tags, Categories } from "../imports/api/collections";
import { createUser } from "../tests/helpers";
import { insertTag } from "../imports/api/methods/tags";
import { insertSite } from "../imports/api/methods/sites";

createTag = (userId, args) => {
  const context = { userId };
  idTag = insertTag._execute(context, args);
  return Tags.findOne({ _id: idTag });
};

loadSitesFixtures = () => {
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

  let tag1 = createTag(userId, tagArgs1);
  let tag2 = createTag(userId, tagArgs2);

  Categories.insert({
    name: "Inside",
  });

  Categories.insert({
    name: "Restauration",
  });

  const url = "https://www.epfl.ch/beaujolais/madame-placard";
  const title = "Ma meilleure découverte 2019";

  const context = { userId };
  const args = {
    url: url,
    tagline: "Yvon Métras",
    title: title,
    openshiftEnv: "www",
    categories: Categories.find({ name: "Restauration" }).fetch(),
    theme: "wp-theme-2018",
    languages: ["en", "fr"],
    unitId: "13030",
    unitName: "IDEV-FSD",
    unitNameLevel2: "SI",
    snowNumber: "42",
    comment: "Vin nature par excellence !",
    createdDate: new Date(),
    userExperience: false,
    userExperienceUniqueLabel: "",
    tags: [tag1, tag2],
    professors: [],
    wpInfra: true,
  };

  insertSite._execute(context, args);
};

loadTestFixtures = () => {
  if (Sites.find({}).count() == 0) {
    console.log("Import sites");
    loadSitesFixtures();
  } else {
    console.log("Sites already exist");
  }
};

export { loadTestFixtures };
