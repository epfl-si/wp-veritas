import { Sites } from "../../../imports/api/collections";

let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

getExpectedResult = () => {
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
      professors: site.professors,
      wpInfra: true,
    },
  ];
  return expectedResult;
};

endpointSites = () => {
  let endpointGetSites = "/api/v1/sites";
  it(`GET ${endpointGetSites}`, function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let expectedResult = getExpectedResult();
    chai
      .request(base_url)
      .get(endpointGetSites)
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.headers["content-type"]).to.equal("application/json");
        expect(JSON.stringify(res.body)).to.eql(JSON.stringify(expectedResult));
      });
  });

  // Get site by ID
  let endpointGetSitesId = "/api/v1/sites/:id";
  it(`GET ${endpointGetSitesId}`, function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let expectedResult = getExpectedResult();
    chai
      .request(base_url)
      .get("/api/v1/sites/" + expectedResult[0]._id)
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.headers["content-type"]).to.equal("application/json");
        expect(JSON.stringify(res.body)).to.eql(
          JSON.stringify(expectedResult[0])
        );
      });
  });

  // Get a site by URL
  let endpointGetSitesSiteURL = "/api/v1/sites?site_url";
  it(`GET ${endpointGetSitesSiteURL}`, function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let expectedResult = getExpectedResult();
    chai
      .request(base_url)
      .get(endpointGetSitesSiteURL + "=" + expectedResult[0].url)
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.headers["content-type"]).to.equal("application/json");
        expect(JSON.stringify(res.body)).to.eql(
          JSON.stringify(expectedResult[0])
        );
      });
  });

    // Get a site by wrong URL
    let endpointGetSitesSiteURL = "/api/v1/sites?site_url";
    it(`GET wrong ${endpointGetSitesSiteURL}`, function () {
      let base_url = "http://localhost:" + process.env.PORT;
      let expectedResult = getExpectedResult();
      chai
        .request(base_url)
        .get(endpointGetSitesSiteURL + "=http://perdu.com/")
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.headers["content-type"]).to.equal("application/json");
          expect(JSON.stringify(res.body)).to.eql(
            JSON.stringify(expectedResult[0])
          );
        });
    });

  // TODO: Get sites by URL pattern
  let endpointGetSitesSearchURL = "/api/v1/sites?search_url";

  // TODO: Get sites by tag name en
  let endpointGetSitesWithTagsEnTag1Tag2 =
    "/api/v1/sites-with-tags-en/:tag1/:tag2";

  // TODO: Get sites by tag name fr
  let endpointGetSitesWithTagsFrTag1Tag2 =
    "/api/v1/sites-with-tags-fr/:tag1/:tag2";

  // TODO: Get sites that a user is admin of
  let endpointGetSitesWpAdminSciper = "/api/v1/sites/wp-admin/:sciper";

  // TODO: Get tags by site ID
  let endpointGetSitesIdTags = "/api/v1/sites/:id/tags";
};

export { endpointSites };
