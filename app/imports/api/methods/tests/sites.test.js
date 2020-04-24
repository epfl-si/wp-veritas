import assert from "assert";
import { Sites } from "../../collections";
import { insertSite, updateSite, removeSite } from "../sites";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";


if (Meteor.isServer) {

  describe("meteor methods site", function () {
    before(function () {
      resetDatabase();
      
    });

    it("insert site", () => {
      let userId = createUser();

      const url = "https://www.epfl.ch/beaujolais/madame-placard";
      const title = "Ma meilleure découverte 2019";
  
      const context = { userId };
      const args = {
        url: url,
        tagline: "Yvon Métras",
        title: title,
        openshiftEnv: "www",
        category: "GeneralPublic",
        theme: "wp-theme-2018",
        languages: ["en", "fr"],
        unitId: "13030",
        unitName: "IDEV-FSD",
        unitNameLevel2: "SI",
        snowNumber: "42",
        comment: "Vin nature par excellence !",
        createdDate: new Date(),
        userExperience: false,
        userExperienceUniqueLabel: "",
        tags: [],
        professors: [],
        wpInfra: true,
      };

      insertSite._execute(context, args);

      let nb = Sites.find({}).count();
      let site = Sites.findOne({ url: url });

      assert.strictEqual(nb, 1);
      assert.strictEqual(site.title, title);
    });

    it("update site", () => {
      let userId = createUser();
      const url = "https://www.epfl.ch/beaujolais/madame-placard";
      const title = "Ma meilleure découverte 2019";
      let site = Sites.findOne({ url: url });

      const context = { userId };
      const args = {
        _id: site._id,
        url: url,
        tagline: site.tagline,
        title: title,
        openshiftEnv: "www",
        category: "GeneralPublic",
        theme: "wp-theme-2018",
        languages: ["en", "fr"],
        unitId: "13030",
        unitName: "IDEV-FSD",
        unitNameLevel2: "SI",
        snowNumber: "42",
        comment: "Vin nature par excellence !",
        createdDate: new Date(),
        userExperience: false,
        userExperienceUniqueLabel: "",
        tags: [],
        professors: [],
        wpInfra: true,
      };

      updateSite._execute(context, args);

      let nb = Sites.find({}).count();
      let siteAfterUpdate = Sites.findOne({ _id: site._id });

      assert.strictEqual(nb, 1);
      assert.strictEqual(siteAfterUpdate.tagline, "Yvon Métras");
      assert.strictEqual(siteAfterUpdate.title, title);
    });

    it("remove site", () => {
      let userId = createUser();
      const url = "https://www.epfl.ch/beaujolais/madame-placard";
      let site = Sites.findOne({ url: url });

      const context = { userId };
      const args = { siteId: site._id };

      let nbBefore = Sites.find({}).count();
      assert.strictEqual(nbBefore, 1);

      removeSite._execute(context, args);

      let nbAfter = Sites.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
