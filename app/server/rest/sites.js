import { Sites, Tags } from "../../imports/api/collections";
import { REST }  from "../../imports/rest";
import { formatSiteCategories } from "./utils";
import { getUnits } from "../units";

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
 *         "category": "GeneralPublic",
 *         "theme": "wp-theme-2018",
 *         "languages": [
 *           "en",
 *           "fr"
 *         ],
 *         "unitId": 13031,
 *         "snowNumber": "",
 *         "comment": "Site canari pour tester l'image",
 *         "createdDate": "2020-03-05T09:52:06.310Z",
 *         "monitorSite": false,
 *         "tags": [],
 *         "wpInfra": true,
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
/**
 * @apiGroup Sites
 * @apiExample {http} Example usage:
 *     https://wp-veritas.epfl.ch/api/v1/sites
 */
// Maps to: /api/v1/sites
// and to: /api/v1/sites?site_url=... to get a specific site
// and to: /api/v1/sites?search_url=... to filter sites based on URL
// and to: /api/v1/sites?tags=... to search a list of sites from an array of tags with status "created" or "no-wordpress"
// and to: /api/v1/sites?tagged=true to retrieve the list of sites with at least a tag with status "created" or "no-wordpress"
REST.addRoute(
  "sites",
  {
    get: async function({ queryParams }) {
      async function addTagsToSites(sites) {
        const enrichedSites = [];
        for (const site of sites) {
          const siteTags = await Tags.find({
            sites: site.url
          }).fetchAsync();
          site.tags = siteTags.map((tag) => (
            {
              _id: tag._id,
              url_fr: tag.url_fr,
              url_en: tag.url_en,
              name_fr: tag.name_fr,
              name_en: tag.name_en,
              type: tag.type,
            }
          ));
          enrichedSites.push(site);
        }
        return enrichedSites;
      }

      let sites = [];
      if (queryParams && queryParams.site_url) {
        let siteUrl = queryParams.site_url;
        // if (!(siteUrl.endsWith("/"))) {
        //   siteUrl = siteUrl + "/";
        // }
        sites = await Sites.find({ url: siteUrl }).fetchAsync();
      } else if (queryParams && queryParams.search_url) {
        sites = await Sites.find({
          url: { $regex: queryParams.search_url, $options: "i" },
        }).fetchAsync();
      } else if (queryParams && queryParams.type) {
        sites = await Sites.find({
          type: queryParams.type,
        }).fetchAsync();
      } else if (queryParams?.tags) {
        if (!Array.isArray(queryParams.tags)) {
          queryParams.tags = [queryParams.tags];
        }
        sites = await Sites.taggedSearchAsync(queryParams.tags);
      } else if (queryParams && queryParams.tagged) {
        sites = await Sites.taggedSearchAsync();
      } else {
        // nope, we are here for all the sites data
        sites = await Sites.find().fetchAsync();
      }
      // Add tags to all sites before formatting
      const sitesWithTags = await addTagsToSites(sites);
      return formatSiteCategories(sitesWithTags);
    }
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
 *         "category": "GeneralPublic",
 *         "theme": "wp-theme-2018",
 *         "languages": [
 *           "en",
 *           "fr"
 *         ],
 *         "unitId": 13031,
 *         "snowNumber": "",
 *         "comment": "Site canari pour tester l'image",
 *         "createdDate": "2020-03-05T09:52:06.310Z",
 *         "monitorSite": false,
 *         "tags": [],
 *         "wpInfra": true,
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
REST.addRoute(
  "inventory/entries",
  {
    get: async function() {
      let sites = await Sites.find({}).fetchAsync();
      return formatSiteCategories(sites);
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
 * @apiSuccess {String} category                  Site category. — DEPRECATED
 * @apiSuccess {Array}  categories                Site categories.
 * @apiSuccess {String} theme                     Site theme.
 * @apiSuccess {Array}  languages                 Site languages.
 * @apiSuccess {Array}  tags                      Site tags.
 * @apiSuccess {String} unitId                    Site unitId.
 * @apiSuccess {String} snowNumber                Site snowNumber.
 * @apiSuccess {String} comment                   Site comment.
 * @apiSuccess {String} createdDate               Site createdDate.
 * @apiSuccess {String} monitorSite               Site monitorSite.
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
 *       "category": "GeneralPublic",
 *       "theme": "wp-theme-2018",
 *       "languages": [
 *         "en",
 *         "fr"
 *       ],
 *       "unitId": "13031",
 *       "snowNumber": "",
 *       "comment": "Site canari pour tester l'image",
 *       "createdDate": "2020-03-05T09:52:06.310Z",
 *       "monitorSite": false,
 *       "tags": [],
 *       "wpInfra": true,
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
REST.addRoute(
  "sites/:id",
  {
    get: async function({ urlParams }) {
      // @TODO: error if ID Not Found

      const site = await Sites.findOneAsync(urlParams.id);

      const tags = await Tags.find(
        { sites: site.url },
      ).fetchAsync();

      return {
        ...formatSiteCategories(site),
        tags: tags.map((tag) => (
          {
            _id: tag._id,
            url_fr: tag.url_fr,
            url_en: tag.url_en,
            name_fr: tag.name_fr,
            name_en: tag.name_en,
            type: tag.type,
          }
        ))
      };
  },
});

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
REST.addRoute(
  "sites/:id/tags",
  {
    get: async function({ urlParams }) {
      // @TODO: SiteNotFound
      let site = await Sites.findOneAsync(urlParams.id);
      const tags = await Tags.find(
        { sites: site.url },
      ).fetchAsync();
      return tags.map((tag) => (
        {
          _id: tag._id,
          url_fr: tag.url_fr,
          url_en: tag.url_en,
          name_fr: tag.name_fr,
          name_en: tag.name_en,
          type: tag.type,
        }
      ))
    },
  }
);

/**
 * @api {get} /sites/wp-admin/:sciper  Get sites that a user is admin of
 * @apiGroup Sites
 */
// Maps to: /api/v1/sites/wp-admin/:sciper
REST.addRoute(
  "sites/wp-admin/:sciper",
  {
    get: async function({ urlParams }) {
      // Get units of sciper
      let units = await getUnits(urlParams.sciper);

      // Get all sites whose unit is present in 'units'
      let sites = await Sites.find({ unitId: { $in: units } }).fetchAsync();

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
REST.addRoute(
  "sites-with-tags-en/:tag1/:tag2",
  {
    get: async function({ uriParams }) {
      let tag1 = urlParams.tag1.toUpperCase();
      let tag2 = urlParams.tag2.toUpperCase();
      let tags = await Tags.find({
        "tags.name_en": tag1,
        "tags.name_en": tag2,
      }).fetchAsync();

      let sites = await Sites.find({
        url: { $in: tags.map((tag) => tag.url) },
      }).fetchAsync();
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
REST.addRoute(
  "sites-with-tags-fr/:tag1/:tag2",
  {
    get: async function({ uriParams }) {
      let tag1 = urlParams.tag1.toUpperCase();
      let tag2 = urlParams.tag2.toUpperCase();
      let tags = await Tags.find({
        "tags.name_fr": tag1,
        "tags.name_fr": tag2,
      }).fetchAsync();

      let sites = await Sites.find({
        url: { $in: tags.map((tag) => tag.url) },
      }).fetchAsync();
      return formatSiteCategories(sites);
    },
  }
);
