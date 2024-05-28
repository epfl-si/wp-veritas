import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Themes, themesSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Admin } from "./role";

const checkUniqueThemeName = async (theme) => {
  if (await Themes.find({ name: theme.name }).countAsync() > 0) {
    throwMeteorError("name", "Nom du thème existe déjà !");
  }
};

const insertTheme = new VeritasValidatedMethod({
  name: "insertTheme",
  role: Admin,
  async validate(newTheme) {
    await checkUniqueThemeName(newTheme);
    themesSchema.validate(newTheme);
  },
  async run(newTheme) {
    let themeDocument = {
      name: newTheme.name,
    };

    let newThemeId = await Themes.insertAsync(themeDocument);
    let newThemeAfterInsert = await Themes.findOneAsync({ _id: newThemeId });

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
  async run({ themeId }) {
    let theme = await Themes.findOneAsync({ _id: themeId });
    await Themes.removeAsync({ _id: themeId });

    AppLogger.getLog().info(
      `Delete theme ID ${themeId}`,
      { before: theme, after: "" },
      this.userId
    );
  },
});

rateLimiter([insertTheme, removeTheme]);

export { insertTheme, removeTheme };
