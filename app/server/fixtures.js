import { Roles } from "meteor/alanning:roles";

const loadRolesFixtures = async () => {
  const roles = ['admin', 'tags-editor', 'epfl-member'];
  for (const role of roles) {
    try {
      await Roles.createRoleAsync(role);
    } catch (e) {
      if (e.toString().includes("duplicate key error")) {
        console.log("🤷‍♂️");
      } else {
        throw e;
      }
    }
  }
}

const loadFixtures = async () => {
  if ((await Roles.getAllRoles().countAsync()) == 0) {
      console.log("    …importing roles");
      await loadRolesFixtures();
  } else {
      console.log("Roles already exist");
  }
}

export { loadFixtures }
