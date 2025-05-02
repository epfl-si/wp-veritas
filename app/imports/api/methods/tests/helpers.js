import { Sites, Categories, Tags } from "../../collections";
import { insertSite } from "../sites";

async function getSitesByTag(tag) {
  [tag] = await Tags.find({name: tag}).fetchAsync();
  if (!tag) return [];
  let sites = await Sites.find({}).fetchAsync();
  return sites.filter(site =>  tag.sites.includes(site.url))
}

async function createSite(userId) {
  const context = { userId };
  const args = {
    url: "https://www.epfl.ch/beaujolais/madame-placard",
    type: "external",
    unitId: 13030,
    snowNumber: "42",
    comment: "Vin nature par excellence !",
    createdDate: new Date().toString(),
    monitorSite: false,
  };
  await insertSite._execute(context, args);
}

export { getSitesByTag, createSite };
