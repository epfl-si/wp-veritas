import { Sites } from "../../imports/api/collections";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { loadFixtures } from "../fixtures";
import { loadTestFixtures } from "../fixtures-test";

let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

if (Meteor.isServer) {
  let base_url;

  describe("api /sites", function () {
    before(() => {
      resetDatabase();
      loadFixtures();
      loadTestFixtures();
      base_url = "http://localhost:" + process.env.PORT;
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
