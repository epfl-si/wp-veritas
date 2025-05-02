import { Roles } from "meteor/alanning:roles";
import Debug from "debug";

const debug = Debug("server/roles");

let rolesDone;

export async function setupRoles () {
  debug("setupRoles: called");
  if (! rolesDone) {
    debug("setupRoles: starting");
    rolesDone = new Promise(async (resolve, reject) => {
      for (const role of ['admin', 'tags-editor', 'epfl-member']) {
        try {
          debug(`setupRoles: creating role ${role}`);
          await Roles.createRoleAsync(role);
        } catch (e) {
          if (e.toString().includes("duplicate key error")) {
            debug(`setupRoles: role ${role} already exists 🤷‍♂️`);
          } else {
            reject(e);
          }
        }
      }
      resolve();
    })
  }
  return rolesDone
}
