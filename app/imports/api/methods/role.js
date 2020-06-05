import { checkUserAndRole } from "./utils";

/**
 * Cette classe a pour but de rendre obligatoire la vérification
 * du role de l'utilisateur.
 *
 * Pour cela, on ajoute à la méthode validate la vérification de l'utilisateur
 */
class VeritasValidatedMethod extends ValidatedMethod {
  constructor(args) {
    const validateOrig = args.validate;
    args.validate = function () {
      args.role.check(this.userId, args.name);
      return validateOrig.apply(this, arguments);
    };
    super(args);
  }
}

class Admin {
  static check(userId, methodName) {
    checkUserAndRole(userId, ["admin"], `Only admins can ${methodName}`);
  }
}

class Editor {
  static check(userId, methodName) {
    checkUserAndRole(
      userId,
      ["admin", "tags-editor"],
      `Only admins or editors can ${methodName}.`
    );
  }
}

export { Admin, Editor, VeritasValidatedMethod };