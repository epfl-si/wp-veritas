import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Categories, categoriesSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { Admin } from "./role";

checkUniqueCategoryName = (category) => {
  if (Categories.find({ name: category.name }).count() > 0) {
    throwMeteorError("name", "Nom de la catégorie existe déjà !");
  }
};

const insertCategory = new ValidatedMethod({
  name: "insertCategory",
  role: Admin,
  validate(newCategory) {
    checkUniqueCategoryName(newCategory);
    categoriesSchema.validate(newCategory);
  },
  run(newCategory) {
    
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
  role: Admin,
  validate: new SimpleSchema({
    categoryId: { type: String },
  }).validator(),
  run({ categoryId }) {

    let category = Categories.findOne({ _id: categoryId });
    Categories.remove({ _id: categoryId });

    AppLogger.getLog().info(
      `Delete category ID associateProfessorsToSite${categoryId}`,
      { before: category, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertCategory, removeCategory]);

export { insertCategory, removeCategory };
