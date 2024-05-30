import SimpleSchema from "simpl-schema";
import { throwMeteorError } from "../error";
import { Sites, Professors, professorSchema } from "../collections";
import { AppLogger } from "../logger";
import { rateLimiter } from "./rate-limiting";
import { VeritasValidatedMethod, Editor } from "./role";

const checkUniqueSciper = async (professor) => {
  if (Professors.find({ sciper: professor.sciper }).countAsync() > 0) {
    throwMeteorError(
      "sciper",
      "Un professeur avec le même sciper existe déjà !"
    );
  }
};

const insertProfessor = new VeritasValidatedMethod({
  name: "insertProfessor",
  role: Editor,
  async validate(newProfessor) {
    await checkUniqueSciper(newProfessor, "insert");
    professorSchema.validate(newProfessor);
  },
  async run(newProfessor) {
    let professorDocument = {
      sciper: newProfessor.sciper,
      displayName: newProfessor.displayName,
    };
    let newProfessorId = await Professors.insertAsync(professorDocument);
    let newProfessorAfterInsert = await Professors.findOneAsync({ _id: newProfessorId });
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
  async run({ professorId }) {
    let professor = await Professors.findOneAsync({ _id: professorId });

    await Professors.removeAsync({ _id: professorId });

    AppLogger.getLog().info(
      `Delete professor ID ${professorId}`,
      { before: professor, after: "" },
      this.userId
    );

    // we need update all sites that have this deleted professor
    let sites = await Sites.find({}).fetchAsync();

    for (const site of sites) {
      const newProfessors = [];
      if ("professors" in site) {
        for (const professor of site.professors) {
          if (professor._id === professorId) {
            // we want delete this tag of current professor
          } else {
            newProfessors.push(professor);
          }
        }
        await Sites.updateAsync(
          { _id: site._id },
          {
            $set: {
              professors: newProfessors,
            },
          }
        );
      }
    }
  },
});

rateLimiter([insertProfessor, removeProfessor]);

export { insertProfessor, removeProfessor };
