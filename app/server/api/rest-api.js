import {
  Sites,
  OpenshiftEnvs,
  Tags,
  Categories,
} from "../../imports/api/collections";

import getUnits from "../units";

import { Api, APIError, formatSiteCategories} from "./utils";
import "./categories";

/**
 * @api {get} /sites  Get all sites
 * @apiGroup Sites
 * @apiName sites
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       ...,
 *       {
 *         "_id": "f7CaxxouACbWiYjQY",
 *         "url": "https://www.epfl.ch/campus/services/canari",
 *         "slug": "",
 *         "tagline": "Canari",
 *         "title": "Test",
 *         "openshiftEnv": "www",
 *         "category": "GeneralPublic",
 *         "theme": "wp-theme-2018",
 *         "languages": [
 *           "en",
 *           "fr"
 *         ],
 *         "unitId": "13031",
 *         "unitName": "idev-ing",
 *         "unitNameLevel2": "si",
 *         "snowNumber": "",
 *         "comment": "Site canari pour tester l'image",
 *         "createdDate": "2020-03-05T09:52:06.310Z",
 *         "userExperience": false,
 *         "tags": [],
 *         "professors": [],
 *         "wpInfra": true,
 *         "userExperienceUniqueLabel": ""
 *       },
 *       ...,
 *     ]
 * @apiError SitesNotFound  No sites returned
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "SitesNotFound"
 *     }
 *
 */
 /**
  * @api {get}  /sites?site_url={param} Get a site by URL
  * @apiGroup Sites
  * @apiName Sites with params
  * @apiParam {String} site_url Exact site URL
  * @apiDescription Note: final slash will be trimmed
  * @apiExample {http} Example usage:
  *     /api/v1/sites?site_url=https://www.epfl.ch/canari
  */
 /**
  * @api {get}  /sites?search_url={param} Get sites by URL pattern
  * @apiGroup Sites
  * @apiName Sites with params
  * @apiParam {String} search_url Text pattern present in URL
  * @apiExample {http} Example usage:
  *     /api/v1/sites?search_url=canari
  */
// Maps to: /api/v1/sites
// and to: /api/v1/sites?site_url=... to get a specific site
// and to: /api/v1/sites?search_url=... to filter sites based on URL
// and to: /api/v1/sites?text=... to search a list of sites from a text
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
        let siteUrl = this.queryParams.site_url;
        if (siteUrl.endsWith("/")) {
          siteUrl = siteUrl.slice(0, -1);
        }
        return formatSiteCategories(Sites.findOne({ url: siteUrl }));
      } else if (query && this.queryParams.search_url) {
        return formatSiteCategories(
          Sites.find({
            url: { $regex: this.queryParams.search_url, $options: "-i" },
          }).fetch()
        );
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

/**
 * @api {get} /sites/:id  Get site by ID
 * @apiGroup Sites
 * @apiName site
 *
 * @apiParam   {Number} id                        Site unique ID.
 *
 * @apiSuccess {String} _id                       Site unique ID.
 * @apiSuccess {String} url                       Site URL.
 * @apiSuccess {String} slug                      Site slug.
 * @apiSuccess {String} tagline                   Site tagline.
 * @apiSuccess {String} title                     Site title.
 * @apiSuccess {String} openshiftEnv              Site openshiftEnv.
 * @apiSuccess {String} category                  Site category. — DEPRECATED
 * @apiSuccess {Array}  categories                Site categories.
 * @apiSuccess {String} theme                     Site theme.
 * @apiSuccess {Array}  languages                 Site languages.
 * @apiSuccess {Array}  tags                      Site tags.
 * @apiSuccess {Array}  professors                Site professors.
 * @apiSuccess {String} unitId                    Site unitId.
 * @apiSuccess {String} unitName                  Site unitName.
 * @apiSuccess {String} unitNameLevel2            Site unitNameLevel2.
 * @apiSuccess {String} snowNumber                Site snowNumber.
 * @apiSuccess {String} comment                   Site comment.
 * @apiSuccess {String} createdDate               Site createdDate.
 * @apiSuccess {String} userExperience            Site userExperience.
 * @apiSuccess {String} userExperienceUniqueLabel Site userExperienceUniqueLabel.
 * @apiSuccess {String} wpInfra                   Site wpInfra.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "f7CaxxouACbWiYjQY",
 *       "url": "https://www.epfl.ch/campus/services/canari",
 *       "slug": "",
 *       "tagline": "Canari",
 *       "title": "Test",
 *       "openshiftEnv": "www",
 *       "category": "GeneralPublic",
 *       "theme": "wp-theme-2018",
 *       "languages": [
 *         "en",
 *         "fr"
 *       ],
 *       "unitId": "13031",
 *       "unitName": "idev-ing",
 *       "unitNameLevel2": "si",
 *       "snowNumber": "",
 *       "comment": "Site canari pour tester l'image",
 *       "createdDate": "2020-03-05T09:52:06.310Z",
 *       "userExperience": false,
 *       "tags": [],
 *       "professors": [],
 *       "wpInfra": true,
 *       "userExperienceUniqueLabel": ""
 *     }
 *
 * @apiError SiteNotFound Site with this ID wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "SiteNotFound"
 *     }
 */
// Maps to: /api/v1/sites/:id
Api.addRoute(
  "sites/:id",
  { authRequired: false },
  {
    get: function () {
      // @TODO: error if ID Not Found
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
/**
 * @api {get} /sites/:id/tags    Get tags by site ID
 * @apiGroup Sites
 * @apiName tags
 *
 * @apiParam   {String} id       Site unique ID.
 *
 * @apiSuccess {String} _id      Site unique ID.
 * @apiSuccess {String} url_fr   Site URL fr.
 * @apiSuccess {String} url_en   Site URL en.
 * @apiSuccess {String} name_fr  Tag name fr.
 * @apiSuccess {String} name_en  Tag name en.
 * @apiSuccess {String} type     Tag type.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "_id": "tbEWhLad86Nr8HYQL",
 *         "url_fr": "https://sti.epfl.ch/fr/",
 *         "url_en": "https://sti.epfl.ch/",
 *         "name_fr": "STI",
 *         "name_en": "STI",
 *         "type": "faculty"
 *       },
 *       {
 *         "_id": "SfT5ACprqquHcuWiG",
 *         "url_fr": "https://sti.epfl.ch/research/institutes/iel/",
 *         "url_en": "https://sti.epfl.ch/fr/recherche/instituts/iel/",
 *         "name_fr": "IEL",
 *         "name_en": "IEL",
 *         "type": "institute"
 *       }
 *     ]
 *
 * @apiError SiteNotFound Site with this ID wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "SiteNotFound"
 *     }
 */
// Maps to: /api/v1/sites/:id/tags
Api.addRoute(
  "sites/:id/tags",
  { authRequired: false },
  {
    get: function () {
      // @TODO: SiteNotFound
      let site = Sites.findOne(this.urlParams.id);
      return site.tags;
    },
  }
);

/**
 * @api {get} /sites-with-tags-en/:tag1/:tag2  Get sites by tag name
 * @apiGroup Sites
 * @apiName tags
 *
 * @apiParam   {String} tag1     Tag name en.
 * @apiParam   {String} tag2     Tag name en.
 *
 * @apiSuccess {String} _id      Site unique ID.
 * @apiSuccess {String} url_fr   Site URL fr.
 * @apiSuccess {String} url_en   Site URL en.
 * @apiSuccess {String} name_fr  Tag name fr.
 * @apiSuccess {String} name_en  Tag name en.
 * @apiSuccess {String} type     Tag type.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "_id": "tbEWhLad86Nr8HYQL",
 *         "url_fr": "https://sti.epfl.ch/fr/",
 *         "url_en": "https://sti.epfl.ch/",
 *         "name_fr": "STI",
 *         "name_en": "STI",
 *         "type": "faculty"
 *       },
 *       {
 *         "_id": "SfT5ACprqquHcuWiG",
 *         "url_fr": "https://sti.epfl.ch/research/institutes/iel/",
 *         "url_en": "https://sti.epfl.ch/fr/recherche/instituts/iel/",
 *         "name_fr": "IEL",
 *         "name_en": "IEL",
 *         "type": "institute"
 *       }
 *     ]
 *
 * @apiError SiteNotFound Site with this ID wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "SiteNotFound"
 *     }
 */
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

/**
 * @api {get} /sites-with-tags-fr/:tag1/:tag2  TODO
 * @apiName tags
 * @apiGroup Sites
 */
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

/**
 * @api {get} /sites/wp-admin/:sciper  TODO
 * @apiGroup Sites
 * @apiName sites
 */
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

/**
 * @api {get} /openshiftenvs  Get all OpenShift environments
 * @apiGroup OpenShift
 * @apiName OpenShiftENV
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       ...,
 *       {
 *         "_id": "BMhjXSzf2brFzsWM6",
 *         "name": "labs"
 *       },
 *       ...,
 *     ]
 */
// Maps to: /api/v1/openshiftenvs/
Api.addRoute(
  "openshiftenvs",
  { authRequired: false },
  {
    get: function () {
      // @TODO: OpenShiftEnvNotFound
      return OpenshiftEnvs.find({}).fetch();
    },
  }
);

/**
 * @api {get} /openshiftenvs/:id  Get OpenShift environment by ID
 * @apiGroup OpenShift
 * @apiName OpenShiftENV
 *
 * @apiParam   {Number} id    OpenShift environment ID.
 *
 * @apiSuccess {String} _id   OpenShift environment ID.
 * @apiSuccess {String} name  OpenShift environment name.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       ...,
 *       {
 *         "_id": "BMhjXSzf2brFzsWM6",
 *         "name": "labs"
 *       },
 *       ...,
 *     ]
 *
 * @apiError OpenShiftEnvNotFound OpenShiftEnv with this ID wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "OpenShiftEnvNotFound"
 *     }
 */
// Maps to: /api/v1/openshiftenvs/:id
Api.addRoute(
  "openshiftenvs/:id",
  { authRequired: false },
  {
    get: function () {
      // @TODO: OpenShiftEnvNotFound
      return OpenshiftEnvs.findOne(this.urlParams.id);
    },
  }
);

/**
 * @api {get} /tags  Get all tags.
 * @apiGroup Tags
 * @apiName tags
 */
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

/**
 * @api {get} /tags/:id  Get tag by ID
 * @apiGroup Tags
 * @apiName tags by ID
 *
 * @apiParam   {Number} id      Tag ID.
 *
 * @apiSuccess {String} _id     Tag ID.
 * @apiSuccess {String} name_fr Tag name fr.
 * @apiSuccess {String} name_en Tag name en.
 * @apiSuccess {String} url_fr  URL fr.
 * @apiSuccess {String} url_en  URL en.
 * @apiSuccess {String} type    Tag type.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "WzuTsoutXC2EJpif4",
 *       "name_fr": "Systems",
 *       "name_en": "Systems",
 *       "url_fr": "https://www.epfl.ch/research/domains/cluster?field-of-research=Systems",
 *       "url_en": "https://www.epfl.ch/research/domains/cluster?field-of-research=Systems",
 *       "type": "field-of-research"
 *     }
 *
 * @apiError TagNotFound OpenShiftEnv with this ID wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "message": "TagNotFound"
 *     }
 */
// Maps to: /api/v1/tags/:id
Api.addRoute(
  "tags/:id",
  { authRequired: false },
  {
    get: function () {
      // @TODO: TagNotFound
      return Tags.findOne(this.urlParams.id);
    },
  }
);

/**
 * @api {get} /tags/:id/clusters-and-professors  TODO
 * @apiGroup Tags
 * @apiName tags
 */
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

/**
 * @api {get} /professors/:sciper/tags  Get all tags for a professor
 * @apiGroup Professors
 * @apiName professors
 */
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





export default Api;
