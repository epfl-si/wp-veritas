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

async function createSite(userId, categories, tags) {
  const context = { userId };
  const args = {
    url: "https://www.epfl.ch/beaujolais/madame-placard",
    tagline: "Yvon Métras",
    title: "Ma meilleure découverte 2019",
    type: "kubernetes",
    categories: categories,
    theme: "wp-theme-2018",
    languages: ["en", "fr"],
    unitId: 13030,
    snowNumber: "42",
    comment: "Vin nature par excellence !",
    createdDate: new Date().toString(),
    monitorSite: false,
    tags: tags,
    wpInfra: true,
  };
  await insertSite._execute(context, args);
}

export { getSitesByTag, createSite };
