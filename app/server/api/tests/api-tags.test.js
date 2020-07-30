let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

endpointTags = () => {
  let endpoint = "/api/v1/tags";
  it(`GET ${endpoint}`, function () {
    let base_url = "http://localhost:" + process.env.PORT;

    chai
      .request(base_url)
      .get(endpoint)
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.ok;
        expect(res.headers["content-type"]).to.equal("application/json");
        //expect(JSON.stringify(res.body)).to.eql(JSON.stringify(expectedResult));
      });
  });
};

export { endpointTags };
