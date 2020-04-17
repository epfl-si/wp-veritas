import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";

import { tagsSchema } from "../collections";

const insertTag = new ValidatedMethod({
  name: "insertTag",
  validate: tagsSchema.validator(),
  run(newTag) {},
});

const updateTag = new ValidatedMethod({
  name: "updateTag",
  validate: tagsSchema.validator(),
  run(newTag) {},
});

const removeTag = new ValidatedMethod({
  name: "removeTag",
  validate: new SimpleSchema({
    tagId: { type: String },
  }).validator(),
  run({ tagId }) {},
});

export { insertTag, updateTag, removeTag };
