import {
  OpenshiftEnvs,
  Themes,
  PlatformTargets,
  Tags,
  Categories,
  AppLogs,
  Professors,
} from "../imports/api/collections";
import { check } from "meteor/check";
import { Roles } from "meteor/alanning:roles";
import { getNamespace, k8sCustomApi, k8sWatchApi } from "./kubernetes";

Meteor.publish("sites.list", async function () {
  const namespace = getNamespace();
  const sitesWatcher = k8sWatchApi.watch(
    "/apis/wordpress.epfl.ch/v2/namespaces/" + namespace + "/wordpresssites",
    {},
    async (type, site) => {
      if (type === "ADDED") {
        this.added("sites", site.metadata.name, {
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
      } else if (type === "DELETED") {
        this.removed("sites", site.metadata.name);
      }
    }
  );
  this.onStop(() => {
    sitesWatcher.abort();
  });

  this.ready();
});

Meteor.publish("deleteSites.list", async function () {
  const sites = await Sites.find({ isDeleted: true }, { sort: { url: 1 } }).fetchAsync();
  sites.forEach((site) => {
    this.added("sites", site._id, site);
  });

  this.ready();
});

Meteor.publish("siteById", function (siteId) {
  check(siteId, String);
  return Sites.find({ _id: siteId });
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
