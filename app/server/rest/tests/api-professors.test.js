import { Professors, Tags } from "../../../imports/api/collections";

let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

const endpointProfessors = () => {
  let endpoint = "/api/v1/professors";
  it(`GET ${endpoint}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let professorId = (await Professors.findOneAsync({ sciper: "188475" }))._id;
    let expectedResult = [
      {
        _id: professorId,
        sciper: "188475",
        displayName: "Charmier Grégory",
      },
    ];
    const res = await chai
      .request(base_url)
      .get(endpoint);
    expect(res).to.have.status(200);
    expect(res).to.be.ok;
    expect(res.headers["content-type"]).to.equal("application/json");
    expect(JSON.stringify(res.body)).to.eql(JSON.stringify(expectedResult));
  });

  let endpointTags = "/api/v1/professors/188475/tags";
  it(`GET ${endpointTags}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;
    let tag1Id = (await Tags.findOneAsync({ name_fr: "Beaujolais" }))._id;
    let tag2Id = (await Tags.findOneAsync({ name_fr: "Vin nature" }))._id;
    let expectedResult = [
      {
        _id: tag1Id,
        name_fr: "Beaujolais",
        name_en: "Beaujolais",
        url_fr: "https://fr.wikipedia.org/wiki/Beaujolais",
        url_en: "https://en.wikipedia.org/wiki/Beaujolais",
        type: "field-of-research",
      },
      {
        _id: tag2Id,
        name_fr: "Vin nature",
        name_en: "Nature wine",
        url_fr: "https://fr.wikipedia.org/wiki/Vin_naturel",
        url_en: "https://en.wikipedia.org/wiki/Natural_wine",
        type: "field-of-research",
      },
    ];

    const res = await chai
      .request(base_url)
      .get(endpointTags);
    expect(res).to.have.status(200);
    expect(res).to.be.ok;
    expect(res.headers["content-type"]).to.equal("application/json");
    expect(JSON.stringify(res.body)).to.eql(JSON.stringify(expectedResult));
  });
};

export { endpointProfessors };
