import {
  Sites,
  OpenshiftEnvs,
  Themes,
  PlatformTargets,
  Tags,
  Categories,
  AppLogs,
  Professors,
} from "./collections";
import { check } from "meteor/check";
import { Roles } from "meteor/alanning:roles";

if (Meteor.isServer) {
  Meteor.publish("sites.list", function () {
    return Sites.find({ isDeleted: false }, { sort: { url: 1 } });
  });

  Meteor.publish("deleteSites.list", function () {
    return Sites.find({ isDeleted: true }, { sort: { url: 1 } });
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
}
