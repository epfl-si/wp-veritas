import {
  Sites,
  OpenshiftEnvs,
  Themes,
  Tags,
  Categories,
  AppLogs,
  Professors,
} from "./collections";
import { check } from "meteor/check";

if (Meteor.isServer) {
  Meteor.publish("sites.list", function () {
    let siteCursor = Sites.find({}, { sort: { url: 1 } });
    return [siteCursor];
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

  Meteor.publish("user.roles", function () {
    return Meteor.roles.find({});
  });

  Meteor.publish("log.list", function () {
    return AppLogs.find({});
  });
}