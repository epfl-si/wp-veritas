import assert from "assert";
import { Professors } from "../../collections";
import { insertProfessor, removeProfessor } from "../professors";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../../../tests/helpers";

if (Meteor.isServer) {
  describe("meteor methods professor", function () {
    before(function () {
      resetDatabase();
    });

    it("insert professor", () => {
      let userId = createUser();

      const context = { userId };
      const args = { 
        sciper: "188475",
        displayName: "Charmier Grégory",
      };

      insertProfessor._execute(context, args);

      let nb = Professors.find({}).count();
      let professor = Professors.findOne({ sciper: "188475" });

      assert.strictEqual(nb, 1);
      assert.strictEqual(professor.displayName, "Charmier Grégory");
    });

    it("remove professor", () => {
      let userId = createUser();
      let professor = Professors.findOne({ sciper: "188475" });

      const context = { userId };
      const args = { professorId: professor._id };

      let nbBefore = Professors.find({}).count();
      assert.strictEqual(nbBefore, 1);

      removeProfessor._execute(context, args);

      let nbAfter = Professors.find({}).count();
      assert.strictEqual(nbAfter, 0);
    });
  });
}
