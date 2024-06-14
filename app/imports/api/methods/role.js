import { checkUserAndRole } from "./utils";
import { createMethod } from 'meteor/jam:method'

/**
 * Cette classe a pour but de rendre obligatoire la vérification
 * du role de l'utilisateur.
 *
 * Pour cela, on ajoute à la méthode validate la vérification de l'utilisateur
 */
class VeritasValidatedMethod {
  constructor(args) {
    const runOrig = args.run,
          validateOrig = args.validate;

    async function run (params) {
      await args.role.check(this.userId, args.name);
      if (Meteor.isClient) return undefined;
      return await runOrig.call(this, params);
    }

    async function validate (...args) {
      console.log("validate", args);
      return await validateOrig(...args);
    }

    const validateOpt = validateOrig ? { validate } : {};

    const ret = createMethod({ ...args, run, ...validateOpt });

    // For tests only:
    ret._execute = async function(context, params) {
      await args.validate.call(undefined, params);
      return await run.call(context, params);
    }

    return ret;
  }
}

class Admin {
  static async check(userId, methodName) {
    await checkUserAndRoleAsync(userId, ["admin"], `Only admins can ${methodName}`);
  }
}

class Editor {
  static async check(userId, methodName) {
    await checkUserAndRoleAsync(
      userId,
      ["admin", "tags-editor"],
      `Only admins or editors can ${methodName}.`
    );
  }
}

export { Admin, Editor, VeritasValidatedMethod };
