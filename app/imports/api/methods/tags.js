import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Sites, Tags, tagSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Editor } from "./role";

const checkUniqueTagName = async (newTag, action) => {
  if (action === "insert") {
    if (await Tags.find({ name_fr: newTag.name_fr }).countAsync() > 0) {
      throwMeteorError("name_fr", "Nom [FR] du type existe déjà !");
    }
    if (await Tags.find({ name_en: newTag.name_en }).countAsync() > 0) {
      throwMeteorError("name_en", "Nom [EN] du type existe déjà !");
    }
  } else if (action === "update") {
    const frTags = Tags.find({ name_fr: newTag.name_fr });
    const frTagsCount = await frTags.countAsync();
    if (
      frTagsCount > 1 ||
      (frTagsCount == 1 && (await frTags.fetchAsync())[0]._id != newTag._id)
    ) {
      throwMeteorError("name_fr", "Nom [FR] du type existe déjà !");
    }
    const enTags = await Tags.find({ name_en: newTag.name_en });
    const enTagsCount = await enTags.countAsync();
    if (
      enTagsCount > 1 ||
      (enTagsCount == 1 && (await enTags.fetchAsync())[0]._id != newTag._id)
    ) {
      throwMeteorError("name_en", "Nom [EN] du type existe déjà !");
    }
  }
};

const insertTag = new VeritasValidatedMethod({
  name: "insertTag",
  role: Editor,
  async validate(newTag) {
    await checkUniqueTagName(newTag, "insert");
    tagSchema.validate(newTag);
  },
  run(newTag) {
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

const updateTag = new VeritasValidatedMethod({
  name: "updateTag",
  role: Editor,
  async validate(newTag) {
    await checkUniqueTagName(newTag, "update");
    tagSchema.validate(newTag);
  },
  run(newTag) {
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

const removeTag = new VeritasValidatedMethod({
  name: "removeTag",
  role: Editor,
  validate: new SimpleSchema({
    tagId: { type: String },
  }).validator(),
  run({ tagId }) {
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
