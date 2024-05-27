import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Themes, themesSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin } from "./role";

const checkUniqueThemeName = (theme) => {
  if (Themes.find({ name: theme.name }).count() > 0) {
    throwMeteorError("name", "Nom du thème existe déjà !");
  }
};

const insertTheme = new VeritasValidatedMethod({
  name: "insertTheme",
  role: Admin,
  validate(newTheme) {
    checkUniqueThemeName(newTheme);
    themesSchema.validate(newTheme);
  },
  run(newTheme) {
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

const removeTheme = new VeritasValidatedMethod({
  name: "removeTheme",
  role: Admin,
  validate: new SimpleSchema({
    themeId: { type: String },
  }).validator(),
  run({ themeId }) {
    let theme = Themes.findOne({ _id: themeId });
    Themes.remove({ _id: themeId });

    AppLogger.getLog().info(
      `Delete theme ID ${themeId}`,
      { before: theme, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertTheme, removeTheme]);

export { insertTheme, removeTheme };
