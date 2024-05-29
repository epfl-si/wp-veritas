const loadRolesFixtures = () => {
  const roles = ['admin', 'tags-editor', 'epfl-member'];
  roles.forEach(
    role => {
      Roles.createRole(role);
    }
  )
}

const loadFixtures = async () => {
  if (Meteor.roles.find({}).count() == 0) {
      console.log("    …importing roles");
      loadRolesFixtures();
  } else {
      console.log("Roles already exist");
  }
}

export { loadFixtures }
