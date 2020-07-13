import { sitesSchema } from "../imports/api/schemas/sitesSchema";
import { Sites, Categories } from "../imports/api/collections";

loadTestData = () => {
  // delete all data
  const absoluteUrl = Meteor.absoluteUrl();
  if (
    absoluteUrl === "http://localhost:3000/" ||
    absoluteUrl.startsWith("https://wp-veritas.128.178.222.83.nip.io/")
  ) {
    Sites.remove({});
  }

  var myjson = {};
  myjson = JSON.parse(Assets.getText("inventory-test.json"));
  let sites = myjson["_meta"]["hostvars"];
  // console.log(sites);

  for (var currentSite in sites) {
    let site = myjson["_meta"]["hostvars"][currentSite];

    if (site.wp_hostname !== "migration-wp.epfl.ch") {
      continue;
    }
    if (site.wp_env !== "int") {
      continue;
    }
    console.log(site);

    let url = `https://${site.wp_hostname}/${site.wp_path}`;
    let title = site.wp_path;
    let category = site["wp_details"]["options"]["epfl:site_category"];
    if (category == null) {
      category = "GeneralPublic";
    }
    let theme = site["wp_details"]["options"]["stylesheet"];
    let languages = site["wp_details"]["polylang"]["langs"];
    if (!languages) {
      continue;
    }
    let unitId = site["wp_details"]["options"]["plugin:epfl_accred:unit_id"];
    let unitName = site["wp_details"]["options"]["plugin:epfl_accred:unit"];

    console.log(url);
    console.log(title);
    console.log(category);
    console.log(theme);
    console.log(languages);
    console.log(unitId);
    console.log(unitName);

    let siteDocument = {
      url: url,
      tagline: "",
      title: title,
      wpInfra: true,
      openshiftEnv: "int",
      category: category,
      theme: theme,
      languages: languages,
      unitId: unitId,
      unitName: unitName,
      unitNameLevel2: "",
      snowNumber: "",
      comment: "",
      userExperience: false,
      userExperienceUniqueLabel: "",
      professors: [],
      tags: [],
    };

    sitesSchema.validate(siteDocument);

    let newSiteId = Sites.insert(siteDocument);
  }
};

deleteUnusedFields = () => {
  let sites = Sites.find({}).fetch();

  sites.forEach((site) => {
    console.log(`Site ${site.url}`);
    console.log("Site avant :", site);

    Sites.update(
      { _id: site._id },
      {
        $unset: {
          type: "",
          status: "",
          plannedClosingDate: "",
          requestedDate: "",
          archivedDate: "",
          trashedDate: "",
          inPreparationDate: "",
          noWordPressDate: "",
        },
      }
    );

    let siteAfter = Sites.findOne({ _id: site._id });
    console.log("Site après : ", siteAfter);
  });
};

cleanNoWPInfraSites = () => {
  let sites = Sites.find({ wpInfra: false }).fetch();

  sites.forEach((site) => {
    console.log(`Site ${site.url}`);
    console.log("Site avant :", site);

    let siteDocument = {
      openshiftEnv: "",
      category: "",
      theme: "",
      languages: [],
      unitId: "",
    };

    Sites.update({ _id: site._id }, { $set: siteDocument });

    let siteAfter = Sites.findOne({ _id: site._id });
    console.log("Site après : ", siteAfter);
  });
};

renameSlugToUserExperienceUniqueLabel = () => {
  let sites = Sites.find({}).fetch();

  sites.forEach((site) => {
    console.log(`Site ${site.url}`);
    console.log("Site avant :", site);

    let slug = "";
    if ("slug" in site && site.slug) {
      slug = site.slug;
    }

    let siteDocument = {
      userExperienceUniqueLabel: slug,
    };

    Sites.update({ _id: site._id }, { $set: siteDocument });

    let siteAfter = Sites.findOne({ _id: site._id });
    console.log("Site après : ", siteAfter);
  });
};

deleteSlug = () => {
  let sites = Sites.find({}).fetch();

  sites.forEach((site) => {
    console.log(`Site ${site.url}`);
    console.log("Site avant :", site);

    Sites.update(
      { _id: site._id },
      {
        $unset: {
          slug: "",
        },
      }
    );

    let siteAfter = Sites.findOne({ _id: site._id });
    console.log("Site après : ", siteAfter);
  });
};

deleteUserProfile = () => {
  let users = Meteor.users.find({}).fetch();
  users.forEach((user) => {
    Meteor.users.update({ _id: user._id }, { $unset: { profile: "" } });
  });
  console.log("All profiles are deleted");
};

updateRoles = () => {
  // Drop 'roles' collection
  Meteor.roles.rawCollection().drop();

  // Delete 'roles' attribut of each user
  let users = Meteor.users.find({}).fetch();
  users.forEach((user) => {
    Meteor.users.update({ _id: user._id }, { $unset: { roles: "" } });
  });

  console.log("All roles of users are deleted");
};

deleteRoleAssignmentScopeNull = () => {
  Meteor.roleAssignment.rawCollection().drop();
};

updateCategoriesFromCategory = () => {

  // Delete GeneralPublic entry
  Categories.remove({ name: "GeneralPublic" });

  let sites = Sites.find().fetch();
  sites.forEach((site) => {
    let category;
    if (site.category === "GeneralPublic") {
      category = [];
    } else {
      category = site.category;
    }
    let siteDocument = {
      categories: Categories.find({ name: category }).fetch(),
    };
    Sites.update({ _id: site._id }, { $set: siteDocument });
  });
  console.log("All sites have now categories !");
};

updateCategoryAdmin = () => {
  let sites = Sites.find().fetch();
  sites.forEach((site) => {
    if (site.category === "admin") {
      let siteDocument = {
        category: "Admin",
      };
      Sites.update({ _id: site._id }, { $set: siteDocument });
    }
  });
  console.log("All sites with admin category are updated");
}

importData = () => {
  const absoluteUrl = Meteor.absoluteUrl();
  /*
  if (
    // absoluteUrl === "http://localhost:3000/" || 
    absoluteUrl.startsWith('https://wp-veritas.128.178.222.83.nip.io/')) {
    loadTestData();
  }
  */
  updateCategoryAdmin();
  updateCategoriesFromCategory();
};

export { importData };
