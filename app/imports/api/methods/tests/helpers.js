import { Sites } from "../../collections";
import { insertSite } from "../sites";

function getSitesByTag(tag) {
  let sitesByTag = [];
  let sites = Sites.find({}).fetch();
  sites.forEach((site) => {
    site.tags.forEach((currentTag) => {
      if (currentTag._id === tag._id) {
        sitesByTag.push(site);
      }
    });
  });
  return sitesByTag;
}

function getSitesByProfessor(professor) {
  let sitesByProfessor = [];
  let sites = Sites.find({}).fetch();
  sites.forEach((site) => {
    site.professors.forEach((currentProfessor) => {
      if (currentProfessor._id === professor._id) {
        sitesByProfessor.push(site);
      }
    });
  });
  return sitesByProfessor;
}

function createSite(userId, categories, tags, professors) {
  const context = { userId };
  const args = {
    url: "https://www.epfl.ch/beaujolais/madame-placard",
    tagline: "Yvon Métras",
    title: "Ma meilleure découverte 2019",
    openshiftEnv: "www",
    categories: categories,
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
    tags: tags,
    professors: professors,
    wpInfra: true,
  };
  insertSite._execute(context, args);
}

export { getSitesByTag, getSitesByProfessor, createSite };
