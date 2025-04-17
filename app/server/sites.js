import { watchWPSites } from "./kubernetes"
import { Sites } from "../imports/api/collections"

Meteor.startup( () => {
  watchWPSites({added, removed});

  async function added(site) {
    await Sites.insertAsync({
      k8sName: site.metadata.name,
      url: site.spec.hostname + site.spec.path,
      title: site.spec.wordpress.title,
      tagline: site.spec.wordpress.tagline,
      openshiftEnv: "kubernetes",
      categories: [],
      theme: site.spec.wordpress.theme,
      platformTarget: "kubernetes",
      languages: site.spec.wordpress.languages,
      unitId: site.spec.owner.epfl.unitId,
      createdDate: site.metadata.creationTimestamp,
    });
  }

  async function removed(site) {
    const toDelete = await Sites.find({url: site.spec.hostname + site.spec.path}).fetchAsync();
    debug(`toDelete has ${toDelete.length} entries`);
    if (toDelete.length == 1) {
      await Sites.removeAsync({_id: toDelete[0]._id});
    } else if (toDelete.length > 1) {
      throw new Error(`Unexpected multiple matches on a search on ${site.metadata.name}: ${toDelete.length} items`)
    }
  }
});
