import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Categories, categoriesSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin } from "./role";
import { Sites } from "../collections";


checkUniqueCategoryName = (category) => {
  if (Categories.find({ name: category.name }).count() > 0) {
    throwMeteorError("name", "Nom de la catégorie existe déjà !");
  }
};

const insertCategory = new VeritasValidatedMethod({
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

const removeCategory = new VeritasValidatedMethod({
  name: "removeCategory",
  role: Admin,
  validate: new SimpleSchema({
    categoryId: { type: String },
  }).validator(),
  run({ categoryId }) {
    // Check that the category to be deleted is not used by any sites
    let sitesUsingThisCategory = Sites.find({ 'categories._id': categoryId });
    if (0 < sitesUsingThisCategory.count()) { // if nothing found, we're happy because that means that there are no sites suing ths category !
      let siteList = sitesUsingThisCategory.fetch(); 
      throwMeteorError(
        "userExperienceCategories",
        "Impossible de supprimer la catégorie, veuillez l'enlever des sites qui l'utilisent:",
        siteList
      );
    }

    let category = Categories.findOne({ _id: categoryId });
    Categories.remove({ _id: categoryId });

    AppLogger.getLog().info(
      `Delete category ID ${categoryId}`,
      { before: category, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertCategory, removeCategory]);

export { insertCategory, removeCategory };
