import { Sites } from "../../collections";
import { insertSite } from "../sites";

async function getSitesByTag(tag) {
  let sitesByTag = [];
  let sites = await Sites.find({}).fetchAsync();
  sites.forEach((site) => {
    site.tags.forEach((currentTag) => {
      if (currentTag._id === tag._id) {
        sitesByTag.push(site);
      }
    });
  });
  return sitesByTag;
}

async function getSitesByProfessor(professor) {
  let sitesByProfessor = [];
  let sites = await Sites.find({}).fetchAsync();
  sites.forEach((site) => {
    site.professors.forEach((currentProfessor) => {
      if (currentProfessor._id === professor._id) {
        sitesByProfessor.push(site);
      }
    });
  });
  return sitesByProfessor;
}

async function createSite(userId, categories, tags, professors) {
  const context = { userId };
  const args = {
    url: "https://www.epfl.ch/beaujolais/madame-placard",
    tagline: "Yvon Métras",
    title: "Ma meilleure découverte 2019",
    type: "kubernetes",
    categories: categories,
    theme: "wp-theme-2018",
    languages: ["en", "fr"],
    unitId: "13030",
    unitName: "ISAS-FSD",
    unitNameLevel2: "VPO-SI",
    snowNumber: "42",
    comment: "Vin nature par excellence !",
    createdDate: new Date(),
    userExperience: false,
    userExperienceUniqueLabel: "",
    tags: tags,
    professors: professors,
    wpInfra: true,
  };
  await insertSite._execute(context, args);
}

export { getSitesByTag, getSitesByProfessor, createSite };
