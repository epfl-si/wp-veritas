let chai = require("chai");
let expect = chai.expect;
let chaiHttp = require("chai-http");
chai.use(chaiHttp);

const endpointOpenshiftEnvs = () => {
  let endpoint = "/api/v1/openshiftenvs";
  it(`GET ${endpoint}`, async function () {
    let base_url = "http://localhost:" + process.env.PORT;

    const res = await chai
      .request(base_url)
      .get(endpoint);
    expect(res).to.have.status(200);
    expect(res).to.be.ok;
    // TODO: expect(res.headers["content-type"]).to.equal("application/json");
    //expect(JSON.stringify(res.body)).to.eql(JSON.stringify(expectedResult));
  });
};

export { endpointOpenshiftEnvs };
