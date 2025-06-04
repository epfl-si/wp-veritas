import {
  Themes,
  Tags,
  AppLogs,
  Sites,
  Types
} from "../imports/api/collections";
import { check } from "meteor/check";
import { Roles } from "meteor/alanning:roles";
import { watchWPSites } from "./kubernetes";
import Debug from "debug";
import { getCategoriesFromPlugins } from "../imports/api/k8s/siteCategories";

const debug = Debug("server/publications");
// This show all the Distributed Data Protocol messages,
// debug purpose only:
// Meteor._printSentDDP = true;

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
        removed = this.removed.bind(this, "sites");

  const observer = await cursor.observeChangesAsync({
    added(id, fields) {
      debug('----added----', new Date(), id, fields);
      const site = fields
      urlOfMongoId[id] = site.url
      added(site.url, site)
    },
    changed(id, fields) {
      const url = urlOfMongoId[id]
      debug('----changed----', new Date(), id, fields, url);
      if (fields.url) {
        throw new Error("Cannot mutate url")
      }
      changed(url, fields)
    },
    removed(id) {
      debug('----removed----', new Date(), id);
      const url = urlOfMongoId[id]
      removed(url)
    }
  });
  this.onStop(() => observer.stop())

  this.ready();   // https://docs.meteor.com/api/collections#Mongo-Cursor-observeAsync says:
                  // Before observeChangesAsync returns, added (or addedBefore) will be called
                  // zero or more times to deliver the initial results of the query.
  debug('----ready----', new Date());
});

Meteor.publish("unit.details", async function (unitId, toCollection) {
  import { getUnitById } from "/server/units.js";
  try {
    const unit = await getUnitById(unitId);
    this.added(toCollection, unitId.toString(), unit);
  } catch (e) {
    console.error(e);
  }
  this.ready();
});

Meteor.publish("k8ssites.list", function () {
  watchWPSites({added, removed, resourcesChanged}, { watchDatabases: true });
  this.ready();

  const add = this.added.bind(this, "sites"),
        change = this.changed.bind(this, "sites"),
        remove = this.removed.bind(this, "sites")

  async function added (site) {
    debug(`Added from k8s: ${site.url}`)
    add(site.url,
      {
          url: site.url,
          k8sName: site.metadata.name,
          title: site.spec.wordpress.title,
          tagline: site.spec.wordpress.tagline,
          type: 'kubernetes',
          categories: getCategoriesFromPlugins(site.spec.wordpress.plugins, site),
          theme: site.spec.wordpress.theme,
          languages: site.spec.wordpress.languages,
          unitId: site.spec.owner.epfl.unitId,
          k8screatedDate: site.metadata.creationTimestamp,
          k8sdeletedDate: site.metadata.deletionTimestamp
      }
    );
  }

  async function removed (site) {
    debug(`Removed from k8s: ${site.url}`)
    remove(site.url)
  }

  async function resourcesChanged (site) {
    change(site.url, {
      k8sDatabaseStatus: this.db?.databaseStatus()
    })
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
