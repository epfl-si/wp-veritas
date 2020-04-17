import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Categories, categoriesSchema } from "../collections";
import { checkUserAndRole } from "./utils";
import { AppLogger } from "../logger";

checkUniqueName = (category) => {
  if (Categories.find({ name: category.name }).count() > 0) {
    throwMeteorError("name", "Nom de la catégorie existe déjà !");
  }
};

const insertCategory = new ValidatedMethod({
  name: "insertCategory",
  validate(newCategory) {
    checkUniqueName(newCategory);
    categoriesSchema.validate(newCategory);
  },
  run(newCategory) {
    checkUserAndRole(
      this.userId,
      ["admin"],
      "Only admins can insert category."
    );

    let categoryDocument = {
      name: newCategory.name,
    };

    let newCategoryId = Categories.insert(categoryDocument);
    let newCategoryAfterInsert = Categories.findOne({ _id: newCategoryId });

    AppLogger.getLog().info(
      `Insert category ID ${newCategory._id}`,
      { before: "", after: newCategoryAfterInsert },
      this.userId
    );

    return newCategoryId;
  },
});

const removeCategory = new ValidatedMethod({
  name: "removeCategory",
  validate: new SimpleSchema({
    categoryId: { type: String },
  }).validator(),
  run({ categoryId }) {
    checkUserAndRole(
      this.userId,
      ["admin"],
      "Only admins can remove category."
    );

    let category = Categories.findOne({ _id: categoryId });
    Categories.remove({ _id: categoryId });

    AppLogger.getLog().info(
      `Delete category ID associateProfessorsToSite${categoryId}`,
      { before: category, after: "" },
      this.userId
    );
  },
});

export { insertCategory, removeCategory };
