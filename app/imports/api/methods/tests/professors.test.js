import assert from "assert";
import { Professors, Categories } from "../../collections";
import { insertProfessor, removeProfessor } from "../professors";
import { createUser } from "../../../../tests/helpers";
import { createSite, getSitesByProfessor } from "./helpers";
import { loadFixtures } from "../../../../server/fixtures";
import { resetDatabase } from "../../../../server/fixtures-test";

if (Meteor.isServer) {
  describe("meteor methods professor", function () {
    before(async function () {
      await resetDatabase();
      await loadFixtures();
    });

    it("insert professor", async () => {
      let userId = await createUser();

      const context = { userId };
      const args = { 
        sciper: "188475",
        displayName: "Charmier Grégory",
      };

      await insertProfessor._execute(context, args);

      let nb = await Professors.find({}).countAsync();
      let professor = await Professors.findOneAsync({ sciper: "188475" });
      
      // Create site with this professor
      await createSite(userId, [], [], [professor]);

      assert.strictEqual(nb, 1);
      assert.strictEqual(professor.displayName, "Charmier Grégory");
    });

    it("remove professor", async () => {
      let userId = await createUser();
      let professor = await Professors.findOneAsync({ sciper: "188475" });

      const context = { userId };
      const args = { professorId: professor._id };

      let nbBefore = await Professors.find({}).countAsync();
      assert.strictEqual(nbBefore, 1);

      let siteNumbersBefore = (await getSitesByProfessor(professor)).length;
      assert.strictEqual(siteNumbersBefore, 1);

      await removeProfessor._execute(context, args);

      let siteNumbersAfter = (await getSitesByProfessor(professor)).length;
      assert.strictEqual(siteNumbersAfter, 0);

      let nbAfter = await Professors.find({}).countAsync();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
