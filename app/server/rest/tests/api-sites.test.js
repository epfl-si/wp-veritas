import { Sites } from "../../../imports/api/collections";

let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);
chai.use(require("deep-equal-in-any-order"));

const getExpectedSiteResult = async () => {
  let site = await Sites.findOneAsync({
    url: "https://www.epfl.ch/beaujolais/madame-placard/",
  });
  let expectedResult = [
    {
      _id: site._id,
      type: "external",
      url: "https://www.epfl.ch/beaujolais/madame-placard/",
      unitId: 13030,
      snowNumber: "42",
      createdDate: site.createdDate,
      monitorSite: false,
      tags: []  // The API endpoint is expected to “left join” them
    },
  ];
  return expectedResult;
};

const endpointSites = () => {
  let endpointGetSites = "/api/v1/sites";
  it(`GET ${endpointGetSites}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let expectedResult = await getExpectedSiteResult();

    const res = await chai
      .request(base_url)
      .get(endpointGetSites);
    expect(res).to.have.status(200);
    expect(res.headers["content-type"]).to.equal("application/json");
    expect(res.body).to.deep.equalInAnyOrder(expectedResult);
  });

  // Get site by ID
  let endpointGetSitesId = "/api/v1/sites/:id";
  it(`GET ${endpointGetSitesId}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let expectedResult = await getExpectedSiteResult();
    const res = await chai
      .request(base_url)
      .get("/api/v1/sites/" + expectedResult[0]._id);
    expect(res).to.have.status(200);
    expect(res.headers["content-type"]).to.equal("application/json");
    let result = res.body
    expect([result]).to.deep.equalInAnyOrder(expectedResult);
  });

  // Get a site by URL
  let endpointGetSitesSiteURL = "/api/v1/sites?site_url";
  it(`GET ${endpointGetSitesSiteURL}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let expectedResult = await getExpectedSiteResult();
    const res = await chai
      .request(base_url)
      .get(endpointGetSitesSiteURL + "=" + expectedResult[0].url);
    expect(res).to.have.status(200);
    expect(res.headers["content-type"]).to.equal("application/json");
    let result = res.body;
    expect(result).to.deep.equalInAnyOrder(expectedResult);
  });

  // Get a site by wrong URL
  it(`GET wrong ${endpointGetSitesSiteURL}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;
    const res = await chai
      .request(base_url)
      .get(endpointGetSitesSiteURL + "=http://perdu.com/");
    expect(res).to.have.status(200);
    expect(res.headers["content-type"]).to.equal("application/json");
    expect(res.body).to.deep.equal([]);
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
