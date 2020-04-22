import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Sites, Tags, tagSchema } from "../collections";
import { checkUserAndRole } from "./utils";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";

checkUniqueName = (newTag, action) => {
  if (action === "insert") {
    if (Tags.find({ name_fr: newTag.name_fr }).count() > 0) {
      throwMeteorError("name_fr", "Nom [FR] du type existe déjà !");
    }
    if (Tags.find({ name_en: newTag.name_en }).count() > 0) {
      throwMeteorError("name_en", "Nom [EN] du type existe déjà !");
    }
  } else if (action === "update") {
    let frTags = Tags.find({ name_fr: newTag.name_fr });
    if (
      frTags.count() > 1 ||
      (frTags.count() == 1 && frTags.fetch()[0]._id != newTag._id)
    ) {
      throwMeteorError("name_fr", "Nom [FR] du type existe déjà !");
    }
    let enTags = Tags.find({ name_en: newTag.name_en });
    if (
      enTags.count() > 1 ||
      (enTags.count() == 1 && enTags.fetch()[0]._id != newTag._id)
    ) {
      throwMeteorError("name_en", "Nom [EN] du type existe déjà !");
    }
  }
};

const insertTag = new ValidatedMethod({
  name: "insertTag",
  validate(newTag) {
    checkUniqueName(newTag, "insert");
    tagSchema.validate(newTag);
  },
  run(newTag) {
    checkUserAndRole(
      this.userId,
      ["admin", "tags-editor"],
      "Only admins and editors can insert tags."
    );

    let newTagDocument = {
      name_fr: newTag.name_fr,
      name_en: newTag.name_en,
      url_fr: newTag.url_fr,
      url_en: newTag.url_en,
      type: newTag.type,
    };

    let newTagAfterInsert = Tags.insert(newTagDocument);

    AppLogger.getLog().info(
      `Insert tag ID ${newTagAfterInsert._id}`,
      { before: "", after: newTagAfterInsert },
      this.userId
    );

    return newTagAfterInsert;
  },
});

const updateTag = new ValidatedMethod({
  name: "updateTag",
  validate(newTag) {
    checkUniqueName(newTag, "update");
    tagSchema.validate(newTag);
  },
  run(newTag) {
    checkUserAndRole(
      this.userId,
      ["admin", "tags-editor"],
      "Only admins and editors can update tags."
    );

    let newTagDocument = {
      name_fr: newTag.name_fr,
      name_en: newTag.name_en,
      url_fr: newTag.url_fr,
      url_en: newTag.url_en,
      type: newTag.type,
    };

    let tagBeforeUpdate = Tags.findOne({ _id: newTag._id });

    Tags.update({ _id: newTag._id }, { $set: newTagDocument });

    let updatedTag = Tags.findOne({ _id: newTag._id });

    AppLogger.getLog().info(
      `Update tag ID ${newTag._id}`,
      { before: tagBeforeUpdate, after: updatedTag },
      this.userId
    );

    // we need update all sites that have this updated tag
    let sites = Sites.find({}).fetch();
    sites.forEach(function (site) {
      newTags = [];
      site.tags.forEach(function (currentTag) {
        if (currentTag._id === newTag._id) {
          // we want update this tag of current site
          newTags.push(newTag);
        } else {
          newTags.push(currentTag);
        }
      });
      Sites.update(
        { _id: site._id },
        {
          $set: {
            tags: newTags,
          },
        }
      );
    });
  },
});

const removeTag = new ValidatedMethod({
  name: "removeTag",
  validate: new SimpleSchema({
    tagId: { type: String },
  }).validator(),
  run({ tagId }) {
    checkUserAndRole(
      this.userId,
      ["admin", "tags-editor"],
      "Only admins and editors can remove tags."
    );

    let tagBeforeDelete = Tags.findOne({ _id: tagId });

    Tags.remove({ _id: tagId });

    AppLogger.getLog().info(
      `Remove tag ID ${tagId}`,
      { before: tagBeforeDelete, after: "" },
      this.userId
    );

    // we need update all sites that have this deleted tag
    let sites = Sites.find({}).fetch();
    sites.forEach(function (site) {
      newTags = [];
      site.tags.forEach((tag) => {
        if (tag._id === tagId) {
          // we want delete this tag of current site
        } else {
          newTags.push(tag);
        }
      });
      Sites.update(
        { _id: site._id },
        {
          $set: {
            tags: newTags,
          },
        }
      );
    });
  },
});

rateLimiter([insertTag, updateTag, removeTag]);

export { insertTag, updateTag, removeTag };
