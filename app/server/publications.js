import {
  OpenshiftEnvs,
  Themes,
  PlatformTargets,
  Tags,
  Categories,
  AppLogs,
  Professors,
  Sites
} from "../imports/api/collections";
import { check } from "meteor/check";
import { Roles } from "meteor/alanning:roles";
import Debug from "debug";

const debug = Debug("server/publications");

Meteor.publish("sites.list", async function () {
  debug("sites.list: subscribed");
  const cursor = Sites.find({});
  for (const site of await cursor.fetchAsync()) {
    this.added("sites", site._id, site);
    // TODO: turn into a live query
  }
  this.ready();

  const that = this;
  cursor.observeChangesAsync({
    added(id, fields) {
      that.added("sites", id, fields);
    },
    changed(id, fields) {
      that.changed("sites", id, fields);
    },
    removed(id) {
      that.removed("sites", id);
    }
  })
});

Meteor.publish("deleteSites.list", async function () {
  const sites = await Sites.find({ isDeleted: true }, { sort: { url: 1 } }).fetchAsync();
  sites.forEach((site) => {
    this.added("sites", site._id, site);
  });

  this.ready();
});

Meteor.publish("openshiftEnv.list", function () {
  let openshiftEnvCursor = OpenshiftEnvs.find({}, { sort: { name: 1 } });
  return [openshiftEnvCursor];
});

Meteor.publish("theme.list", function () {
  let themeCursor = Themes.find({}, { sort: { name: 1 } });
  return [themeCursor];
});

Meteor.publish("platformTarget.list", function () {
  let platformTargetCursor = PlatformTargets.find({}, { sort: { name: 1 } });
  return [platformTargetCursor];
});

Meteor.publish("category.list", function () {
  let categoryCursor = Categories.find({}, { sort: { name: 1 } });
  return [categoryCursor];
});

Meteor.publish("tag.list", function () {
  let tagCursor = Tags.find({}, { sort: { name_fr: 1 } });
  return [tagCursor];
});

Meteor.publish("professor.list", function () {
  let professorCursor = Professors.find({}, { sort: { sciper: 1 } });
  return [professorCursor];
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
