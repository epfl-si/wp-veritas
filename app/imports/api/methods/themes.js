import { ValidatedMethod } from "meteor/mdg:validated-method";
import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Themes, themesSchema } from "../collections";
import { checkUserAndRole } from "./utils";
import { AppLogger } from "../logger";

checkUniqueName = (theme) => {
  if (Themes.find({ name: theme.name }).count() > 0) {
    throwMeteorError("name", "Nom du thème existe déjà !");
  }
};

const insertTheme = new ValidatedMethod({
  name: "insertTheme",
  validate(newTheme) {
    checkUniqueName(newTheme);
    themesSchema.validate(newTheme);
  },
  run(newTheme) {
    checkUserAndRole(this.userId, ["admin"], "Only admins can insert Theme");

    let themeDocument = {
      name: newTheme.name,
    };

    let newThemeId = Themes.insert(themeDocument);
    let newThemeAfterInsert = Themes.findOne({ _id: newThemeId });

    AppLogger.getLog().info(
      `Insert theme ID ${newThemeId}`,
      { before: "", after: newThemeAfterInsert },
      this.userId
    );

    return newThemeAfterInsert;
  },
});

const removeTheme = new ValidatedMethod({
  name: "removeTheme",
  validate: new SimpleSchema({
    themeId: { type: String },
  }).validator(),
  run({ themeId }) {
    checkUserAndRole(this.userId, ["admin"], "Only admins can remove Theme");

    let theme = Themes.findOne({ _id: themeId });
    Themes.remove({ _id: themeId });

    AppLogger.getLog().info(
      `Delete theme ID ${themeId}`,
      { before: theme, after: "" },
      this.userId
    );
  },
});

export { insertTheme, removeTheme };
