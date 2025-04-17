import { watchWPSites } from "./kubernetes"
import { Sites } from "../imports/api/collections"

Meteor.startup( async () => {
  watchWPSites({added, removed});

  async function added(site) {
    const url = site.spec.hostname + site.spec.path;
    await Sites.upsertAsync(
      { url },
      {
        $set: {
          k8sName: site.metadata.name,
          title: site.spec.wordpress.title,
          tagline: site.spec.wordpress.tagline,
          openshiftEnv: "kubernetes",
          categories: [],
          theme: site.spec.wordpress.theme,
          platformTarget: "kubernetes",
          languages: site.spec.wordpress.languages,
          unitId: site.spec.owner.epfl.unitId,
          createdDate: site.metadata.creationTimestamp,
        }
      }
    );
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

  const MongoSites = new Mongo.Collection('sites');
  const cursor = MongoSites.find({});
  for (const site of await cursor.fetchAsync()) {
    delete site._id;
    await Sites.upsertAsync(
      { url: site.url },
      {
        $set: site
      }
    );
  }
  cursor.observeChangesAsync({
    async added(id, fields) {
      delete fields._id;
      await Sites.upsertAsync(
        { url: fields.url },
        {
          $set: {...fields, _id_mongo: id}
        }
      );
    },
    async changed(id, fields) {
      await Sites.updateAsync(
        { _id_mongo: id },
        {
          $set: fields
        }
      );
    },
    // removed(id) {
    //   ...
    // }
  })
});
