import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Sites, Professors, professorSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Editor } from "./role";

checkUniqueSciper = (professor) => {
  if (Professors.find({ sciper: professor.sciper }).count() > 0) {
    throwMeteorError(
      "sciper",
      "Un professeur avec le même sciper existe déjà !"
    );
  }
};

const insertProfessor = new VeritasValidatedMethod({
  name: "insertProfessor",
  role: Editor,
  validate(newProfessor) {
    checkUniqueSciper(newProfessor, "insert");
    professorSchema.validate(newProfessor);
  },
  run(newProfessor) {
    let professorDocument = {
      sciper: newProfessor.sciper,
      displayName: newProfessor.displayName,
    };
    let newProfessorId = Professors.insert(professorDocument);
    let newProfessorAfterInsert = Professors.findOne({ _id: newProfessorId });
    AppLogger.getLog().info(
      `Insert professor ID ${newProfessorId}`,
      { before: "", after: newProfessorAfterInsert },
      this.userId
    );
    return newProfessorAfterInsert;
  },
});

const removeProfessor = new VeritasValidatedMethod({
  name: "removeProfessor",
  role: Editor,
  validate: new SimpleSchema({
    professorId: { type: String },
  }).validator(),
  run({ professorId }) {
    let professor = Professors.findOne({ _id: professorId });

    Professors.remove({ _id: professorId });

    AppLogger.getLog().info(
      `Delete professor ID ${professorId}`,
      { before: professor, after: "" },
      this.userId
    );

    // we need update all sites that have this deleted professor
    let sites = Sites.find({}).fetch();
    sites.forEach(function (site) {
      newProfessors = [];
      if ("professors" in site) {
        site.professors.forEach(function (professor) {
          if (professor._id === professorId) {
            // we want delete this tag of current professor
          } else {
            newProfessors.push(professor);
          }
        });
        Sites.update(
          { _id: site._id },
          {
            $set: {
              professors: newProfessors,
            },
          }
        );
      }
    });
  },
});

rateLimiter([insertProfessor, removeProfessor]);

export { insertProfessor, removeProfessor };
