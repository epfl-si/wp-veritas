import assert from "assert";
import { Sites, Tags, Categories } from "../../imports/api/collections";
import { insertSite } from "../../imports/api/methods/sites";
import { insertTag } from "../../imports/api/methods/tags";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../tests/helpers";
import { loadFixtures } from "../fixtures";

let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

function createTag(userId, args) {
  const context = { userId };
  idTag = insertTag._execute(context, args);
  return Tags.findOne({ _id: idTag });
}

if (Meteor.isServer) {

  let base_url;

  describe.only("api /sites", function () {
    before(() => {
      resetDatabase();
      loadFixtures();
      Categories.insert({
        name: "Inside",
      });
      Categories.insert({
        name: "Restauration",
      });

      base_url = "http://localhost:" + process.env.PORT;
    });

    it("insert site", () => {
      let userId = createUser();

      const tagArgs1 = {
        name_fr: "Beaujolais",
        name_en: "Beaujolais",
        url_fr: "https://fr.wikipedia.org/wiki/Beaujolais",
        url_en: "https://en.wikipedia.org/wiki/Beaujolais",
        type: "field-of-research",
      };

      const tagArgs2 = {
        name_fr: "Vin nature",
        name_en: "Nature wine",
        url_fr: "https://fr.wikipedia.org/wiki/Vin_naturel",
        url_en: "https://en.wikipedia.org/wiki/Natural_wine",
        type: "field-of-research",
      };

      let tag1 = createTag(userId, tagArgs1);
      let tag2 = createTag(userId, tagArgs2);

      let tagsNumber = Tags.find({}).count();
      assert.strictEqual(tagsNumber, 2);

      const url = "https://www.epfl.ch/beaujolais/madame-placard";
      const title = "Ma meilleure découverte 2019";

      const context = { userId };
      const args = {
        url: url,
        tagline: "Yvon Métras",
        title: title,
        openshiftEnv: "www",
        category: "GeneralPublic",
        categories: Categories.find({ name: "Restauration" }).fetch(),
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
        tags: [tag1, tag2],
        professors: [],
        wpInfra: true,
      };

      insertSite._execute(context, args);

      let sitesNumber = Sites.find({}).count();
      let site = Sites.findOne({ url: url });

      assert.strictEqual(site.categories.length, 1);
      assert.strictEqual(site.categories[0].name, "Restauration");

      assert.strictEqual(sitesNumber, 1);
      assert.strictEqual(site.title, title);
    });

    it("GET /api/v1/sites", function () {
      let site = Sites.findOne({
        url: "https://www.epfl.ch/beaujolais/madame-placard",
      });
      let expectedResult = [
        {
          _id: site._id,
          url: "https://www.epfl.ch/beaujolais/madame-placard",
          tagline: "Yvon Métras",
          title: "Ma meilleure découverte 2019",
          openshiftEnv: "www",
          category: "GeneralPublic",
          categories: ["Restauration"],
          theme: "wp-theme-2018",
          languages: site.languages,
          unitId: "13030",
          unitName: "idev-fsd",
          unitNameLevel2: "si",
          snowNumber: "42",
          comment: "Vin nature par excellence !",
          createdDate: site.createdDate,
          userExperience: false,
          userExperienceUniqueLabel: "",
          tags: site.tags,
          professors: [],
          wpInfra: true,
        },
      ];

      chai
        .request(base_url)
        .get("/api/v1/sites")
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.headers["content-type"]).to.equal("application/json");
          expect(JSON.stringify(res.body)).to.eql(
            JSON.stringify(expectedResult)
          );
        });
    });
  });
}
