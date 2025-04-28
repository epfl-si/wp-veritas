import {
  Themes,
  Tags,
  Categories,
  AppLogs,
  Sites,
  Types
} from "../imports/api/collections";
import { check } from "meteor/check";
import { Roles } from "meteor/alanning:roles";
import { watchWPSites } from "./kubernetes";
import Debug from "debug";

const debug = Debug("server/publications");

Meteor.publish("sites.list", async function () {
  const cursor = Sites.find({})
  const urlOfMongoId = {}

  // In order to let Meteor's so-called “mergebox” do its job
  // w.r.t. the next Meteor.publish down below
  // (as per https://guide.meteor.com/data-loading#lifecycle),
  // we can't just return the cursor; we need to remap
  // the sites' URL as the client-side primary key.

  const added = this.added.bind(this, "sites"),
        changed = this.changed.bind(this, "sites"),
        removed = this.removed.bind(this, "sites")
  for (const site of await cursor.fetchAsync()) {
    urlOfMongoId[site._id] = site.url
    added(site.url, site)
  }
  this.ready()
  cursor.observeChangesAsync({
    added(id, fields) {
      const site = fields
      urlOfMongoId[id] = site.url
      added(site.url, site)
    },
    changed(id, fields) {
      const url = urlOfMongoId[id]
      if (fields.url) {
        throw new Error("Cannot mutate url")
      }
      changed(url, fields)
    },
    removed(id) {
      const url = urlOfMongoId[id]
      removed(url)
    }
  }).then((observer) => {
    this.onStop(() => observer.stop())
  })
});

Meteor.publish("k8ssites.list", function () {
  watchWPSites({added, removed});
  this.ready();

  const add = this.added.bind(this, "sites"),
        change = this.changed.bind(this, "sites"),
        remove = this.removed.bind(this, "sites")

  function getUrl (site) {
    return `https://${site.spec.hostname}${site.spec.path}${!site.spec.path.endsWith("/") ? "/" : ""}`;
  }

  async function added (site) {
    const url = getUrl(site)
    debug(`Added from k8s: ${url}`)
    add(url,
      {
          url,
          k8sName: site.metadata.name,
          title: site.spec.wordpress.title,
          tagline: site.spec.wordpress.tagline,
          type: 'kubernetes',
          categories: [],
          theme: site.spec.wordpress.theme,
          languages: site.spec.wordpress.languages,
          unitId: site.spec.owner.epfl.unitId,
          createdDate: site.metadata.creationTimestamp,
      }
    );
  }

  async function removed (site) {
    const url = getUrl(site)
    debug(`Removed from k8s: ${url}`)
    remove(url)
  }
});

Meteor.publish("deleteSites.list", async function () {
  const sites = await Sites.find({ isDeleted: true }, { sort: { url: 1 } }).fetchAsync();
  sites.forEach((site) => {
    this.added("sites", site._id, site);
  });

  this.ready();
});

Meteor.publish("theme.list", function () {
  let themeCursor = Themes.find({}, { sort: { name: 1 } });
  return [themeCursor];
});

Meteor.publish("category.list", function () {
  let categoryCursor = Categories.find({}, { sort: { name: 1 } });
  return [categoryCursor];
});

Meteor.publish("tag.list", function () {
  let tagCursor = Tags.find({}, { sort: { name_fr: 1 } });
  return [tagCursor];
});

Meteor.publish("type.list", function () {
  let typeCursor = Types.find({}, { sort: { name: 1 } });
  return [typeCursor];
});

Meteor.publish("user.list", function () {
  return Meteor.users.find({});
});

Meteor.publish("log.list", function () {
  return AppLogs.find({});
});

Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({ "user._id": this.userId });
  } else {
    this.ready();
  }
});
