const loadRolesFixtures = async () => {
  const roles = ['admin', 'tags-editor', 'epfl-member'];
  for (const role of roles) {
      await Roles.createRoleAsync(role);
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
