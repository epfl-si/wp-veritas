let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

endpointProfessors = () => {
  let endpoint = "/api/v1/professors"
  it(`GET ${endpoint}`, function () {
    let base_url = "http://localhost:" + process.env.PORT;

    chai
      .request(base_url)
      .get(endpoint)
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.ok;
        // TODO: expect(res.headers["content-type"]).to.equal("application/json");
        //expect(JSON.stringify(res.body)).to.eql(JSON.stringify(expectedResult));
      });
  });
};

export { endpointProfessors };
