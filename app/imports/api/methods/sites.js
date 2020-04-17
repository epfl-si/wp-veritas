import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";

import { sitesSchema, sitesWPInfraOutsideSchema } from "../collections";

const insertSite = new ValidatedMethod({
  name: "insertSite",
  validate: sitesSchema.validator(),
  run(newTag) {},
});

const updateSite = new ValidatedMethod({
  name: "updateSite",
  validate: sitesSchema.validator(),
  run(newSite) {},
});

const removeSite = new ValidatedMethod({
  name: "removeSite",
  validate: new SimpleSchema({
    siteId: { type: String },
  }).validator(),
  run({ siteId }) {},
});

export { insertSite, updateSite, removeSite };
