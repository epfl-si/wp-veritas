import assert from "assert";
import "../imports/api/methods/tests/categories.test";
import "../imports/api/methods/tests/openshift-env.test";
import "../imports/api/methods/tests/professors.test";
import "../imports/api/methods/tests/themes.test";
import "../imports/api/methods/tests/tags.test";
import "../imports/api/methods/tests/sites.test";
import "../server/rest/tests/rest-api.test";

describe("wp-veritas", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "wp-veritas");
  });
});
