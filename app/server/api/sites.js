import { Sites } from "../../imports/api/collections";
import { Api, formatSiteCategories, generateAnsibleHostPattern } from "./utils";
import getUnits from "../units";

/**
 * @api {get} /sites  Get all active sites (isDeleted: false)
 * @apiGroup Sites
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
 * @apiParam {String} site_url Exact site URL
 * @apiDescription Note: final slash will be trimmed
 * @apiExample {http} Example usage:
 *     https://wp-veritas.epfl.ch/api/v1/sites?site_url=https://www.epfl.ch/canari
 */
/**
 * @api {get}  /sites?search_url={param} Get sites by URL pattern
 * @apiGroup Sites
 * @apiParam {String} search_url Text pattern present in URL
 * @apiExample {http} Example usage:
 *     https://wp-veritas.epfl.ch/api/v1/sites?search_url=canari
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
        return formatSiteCategories(Sites.find({ isDeleted: false, url: siteUrl }).fetch());
      } else if (query && this.queryParams.search_url) {
        return formatSiteCategories(
          Sites.find({
            isDeleted: false,
            url: { $regex: this.queryParams.search_url, $options: "-i" },
          }).fetch()
        );
      } else if (query && (this.queryParams.text || this.queryParams.tags)) {
        if (this.queryParams.tags && !Array.isArray(this.queryParams.tags)) {
          this.queryParams.tags = [this.queryParams.tags];
        }
        let sites = Sites.tagged_search(this.queryParams.text, this.queryParams.tags);
        return formatSiteCategories(sites);
      } else if (query && this.queryParams.tagged) {
        let sites = Sites.tagged_search();
        return formatSiteCategories(sites);
      } else {
        // nope, we are here for all the sites data
        let sites = Sites.find({ isDeleted: false }).fetch();
        for (let site of sites) {
          site["ansibleHost"] = generateAnsibleHostPattern(site);
        }
        return formatSiteCategories(sites);
      }
    },
  }
);

/**
 * @api {get} /inventory/entries  Get all sites (active or deleted)
 * @apiGroup Sites
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
Api.addRoute(
  "inventory/entries",
  { authRequired: false },
  {
    get: function () {
      let sites = Sites.find({}).fetch();
      for (let site of sites) {
        site["ansibleHost"] = generateAnsibleHostPattern(site);
      }
      return formatSiteCategories(sites);
    },
  }
);

/**
 * @api {get} /inventory/entries:ansibleHost  Get site by ansibleHost
 * @apiGroup Sites
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
 * @apiSuccess {String} ansibleHost               Site ansibleHost.
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
 *       "categories": [],
 *       "isDeleted": false,
 *       "ansibleHost": "www__campus_services_canari"
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
// Maps to: /api/v1/sites/:ansibleHost
Api.addRoute(
  "inventory/entries/:ansibleHost",
  { authRequired: false },
  {
    get: function () {
      let currentSite;
      let sites = Sites.find({}).fetch();
      for (let site of sites) {
        let ansibleHost = generateAnsibleHostPattern(site);
        if (ansibleHost === this.urlParams.ansibleHost) {
          site.ansibleHost = ansibleHost;
          currentSite = site;
          break;
        }
      }
      return formatSiteCategories(currentSite);
    },
  }
);

/**
 * @api {get} /sites/:id  Get site by ID
 * @apiGroup Sites
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
 * @api {get} /sites/wp-admin/:sciper  Get sites that a user is admin of
 * @apiGroup Sites
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
 * @api {get} /sites-with-tags-en/:tag1/:tag2  Get sites by tag name en
 * @apiGroup Sites
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
        isDeleted: false,
        "tags.name_en": tag1,
        "tags.name_en": tag2,
      }).fetch();
      return formatSiteCategories(sites);
    },
  }
);

/**
 * @api {get} /sites-with-tags-fr/:tag1/:tag2  Get sites by tag name fr
 * @apiGroup Sites
 *
 * @apiParam   {String} tag1     Tag name fr.
 * @apiParam   {String} tag2     Tag name fr.
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
// Maps to: /api/v1/sites-with-tags-fr/:tag1/:tag2
Api.addRoute(
  "sites-with-tags-fr/:tag1/:tag2",
  { authRequired: false },
  {
    get: function () {
      let tag1 = this.urlParams.tag1.toUpperCase();
      let tag2 = this.urlParams.tag2.toUpperCase();
      let sites = Sites.find({
        isDeleted: false,
        "tags.name_fr": tag1,
        "tags.name_fr": tag2,
      }).fetch();
      return formatSiteCategories(sites);
    },
  }
);
