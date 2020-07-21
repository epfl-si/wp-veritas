import {
  Sites,
  OpenshiftEnvs,
  Tags,
  Categories,
} from "../imports/api/collections";
import getUnits from "./units";

// Global API configuration
let Api = new Restivus({
  useDefaultAuth: true,
  prettyJson: true,
  version: "v1",
});

const isIterable = (obj) => {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
};

const formatSiteCategories = (sites) => {
  if (isIterable(sites)) {
    for (let site of sites) {
      if (site.categories) {
        site.categories = site.categories.map((category) => category.name);
      }
    }
  } else {
    if (sites.categories) {
      sites.categories = sites.categories.map((category) => category.name);
    }
  }
  return sites;
};

// Maps to: /api/v1/sites
// and to: /api/v1/sites?site_url=... to get a specific site
// and to: /api/v1/sites?text=... to search a list of sites from a text with status "created" or "no-wordpress"
// and to: /api/v1/sites?tags=... to search a list of sites from an array of tags with status "created" or "no-wordpress"
// and to: /api/v1/sites?tagged=true to retrieve the list of sites with at least a tag with status "created" or "no-wordpress"
Api.addRoute(
  "sites",
  { authRequired: false },
  {
    get: function () {
      // is that a id request from an url ?
      var query = this.queryParams;

      if (query && this.queryParams.site_url) {
        return formatSiteCategories(Sites.findOne({ url: this.queryParams.site_url }));
      } else if (query && (this.queryParams.text || this.queryParams.tags)) {
        if (this.queryParams.tags && !Array.isArray(this.queryParams.tags)) {
          this.queryParams.tags = [this.queryParams.tags];
        }
        let sites = Sites.tagged_search(
          this.queryParams.text,
          this.queryParams.tags
        );
        return formatSiteCategories(sites);
      } else if (query && this.queryParams.tagged) {
        let sites = Sites.tagged_search();
        return formatSiteCategories(sites);
      } else {
        // nope, we are here for all the sites data
        let sites = Sites.find({}).fetch();
        return formatSiteCategories(sites);
      }
    },
  }
);

// Maps to: /api/v1/sites/:id
Api.addRoute(
  "sites/:id",
  { authRequired: false },
  {
    get: function () {
      return formatSiteCategories(Sites.findOne(this.urlParams.id));
    },
  }
);

/*
// Maps to: /api/v1/sites/:title/tags
Api.addRoute('sites-by-title/:title/tags', {authRequired: false}, {
  get: function () {
    let site = Sites.findOne({title: this.urlParams.title});
    return site.tags;
  }
});
*/

// Maps to: /api/v1/sites/:id/tags
Api.addRoute(
  "sites/:id/tags",
  { authRequired: false },
  {
    get: function () {
      let site = Sites.findOne(this.urlParams.id);
      return site.tags;
    },
  }
);

// Maps to: /api/v1/sites-with-tags-en/:tag1/:tag2
Api.addRoute(
  "sites-with-tags-en/:tag1/:tag2",
  { authRequired: false },
  {
    get: function () {
      let tag1 = this.urlParams.tag1.toUpperCase();
      let tag2 = this.urlParams.tag2.toUpperCase();
      let sites = Sites.find({
        "tags.name_en": tag1,
        "tags.name_en": tag2,
      }).fetch();
      return formatSiteCategories(sites);
    },
  }
);

// Maps to: /api/v1/sites-with-tags-fr/:tag1/:tag2
Api.addRoute(
  "sites-with-tags-fr/:tag1/:tag2",
  { authRequired: false },
  {
    get: function () {
      let tag1 = this.urlParams.tag1.toUpperCase();
      let tag2 = this.urlParams.tag2.toUpperCase();
      let sites = Sites.find({
        "tags.name_fr": tag1,
        "tags.name_fr": tag2,
      }).fetch();
      return formatSiteCategories(sites);
    },
  }
);

// Maps to: /api/v1/sites/wp-admin/:sciper
Api.addRoute(
  "sites/wp-admin/:sciper",
  { authRequired: false },
  {
    get: function () {
      // Get units of sciper
      let units = getUnits(this.urlParams.sciper);

      // Get all sites whose unit is present in 'units'
      let sites = Sites.find({ unitId: { $in: units } }).fetch();

      // Create an array with only wp-admin URL
      admins = [];
      for (let index in sites) {
        admins.push(sites[index].url + "/wp-admin");
      }

      return admins;
    },
  }
);

// Maps to: /api/v1/openshiftenvs/
Api.addRoute(
  "openshiftenvs",
  { authRequired: false },
  {
    get: function () {
      return OpenshiftEnvs.find({}).fetch();
    },
  }
);

// Maps to: /api/v1/openshiftenvs/:id
Api.addRoute(
  "openshiftenvs/:id",
  { authRequired: false },
  {
    get: function () {
      return OpenshiftEnvs.findOne(this.urlParams.id);
    },
  }
);

// Maps to: /api/v1/tags/
// Maps to: /api/v1/tags/?type=<type>
Api.addRoute(
  "tags",
  { authRequired: false },
  {
    get: function () {
      var query = this.queryParams;
      if (query && this.queryParams.type) {
        return Tags.find({ type: this.queryParams.type }).fetch();
      }
      return Tags.find({}).fetch();
    },
  }
);

// Maps to: /api/v1/tags/:id
Api.addRoute(
  "tags/:id",
  { authRequired: false },
  {
    get: function () {
      return Tags.findOne(this.urlParams.id);
    },
  }
);

// Maps to: /api/v1/tags/:id/field-of-research
// Example: Return all tags of 'field-of-research' type of tag STI
Api.addRoute(
  "tags/:id/clusters-and-professors",
  { authRequired: false },
  {
    get: function () {
      // Récupère le tag passé en paramètre. Par exemple: STI
      let tagId = this.urlParams.id;

      // Récupère tous les sites qui ont le tag STI
      let sites = Sites.find({ "tags._id": tagId }).fetch();

      let tags = [];
      let scipers = [];
      // Je parcours ces sites
      sites.forEach((site) => {
        // et je créée la liste des tags de type 'field-of-research' de ces sites.
        site.tags.forEach((tag) => {
          if (tag.type == "field-of-research") {
            tags.push(tag);
          }
        });
        // et je créée la liste des scipers ces sites.
        site.professors.forEach((professor) => {
          scipers.push(professor.sciper);
        });
      });

      let result = {
        tags: tags,
        professors: scipers,
      };
      return result;
    },
  }
);

// Maps to: /api/v1/professors/:sciper/tags
// Example: Return all tags of this sciper :sciper
Api.addRoute(
  "professors/:sciper/tags",
  { authRequired: false },
  {
    get: function () {
      let sciper = this.urlParams.id;
      let sites = Sites.find({ "professors.sciper": sciper }).fetch();
      let tags = [];
      sites.forEach((site) => {
        if (site.tags.length > 0) {
          // array merge
          tags = [...new Set([...tags, ...site.tags])];
        }
      });
      return tags;
    },
  }
);

// Maps to: /api/v1/categories/
Api.addRoute(
  "categories",
  { authRequired: false },
  {
    get: function () {
      return Categories.find({}).fetch();
    },
  }
);

// Maps to: /api/v1/categories/:name
Api.addRoute(
  "categories/:name",
  { authRequired: false },
  {
    get: function () {
      return Categories.findOne({ name: this.urlParams.name });
    },
  }
);

export default Api;
