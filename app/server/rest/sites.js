import { Sites, Tags } from "../../imports/api/collections";
import { REST }  from "../../imports/rest";
import { formatSiteCategories } from "./utils";
import { getUnits } from "../units";

import { watchWPSites } from "../kubernetes";

const MergedSites = (function() {
  const kubernetesSitesByUrl = {};

  if (! process.env.KUBERNETES_FAKE) {
    watchWPSites({
      added (site) {
        kubernetesSitesByUrl[site.url] = {
          title: site.title, url: site.url,
          ...site
        };
      },

      removed (site) {
        delete kubernetesSitesByUrl[site.url];
      }
    });
  }

  function merged (k8sSites, mongoSites) {
    const sites = {};

    function accumulate (site) {
      if (site === undefined) return;
      delete site.tags;  // Temporary — While we still have these in the database
      sites[site.url] = {
        ...(sites[site.url] || {}),
        ...site
      };
    }

    k8sSites.map(accumulate);
    mongoSites.map(accumulate);
    return Object.values(sites);
  }

  return {
    async allUndeleted () {
      return merged(
        Object.values(kubernetesSitesByUrl),
        await Sites.findAllUndeleted());
    },

    async byUrl (url) {
      return merged(
        [kubernetesSitesByUrl[url]],
        [await Sites.findOneAsync({ url })]);
    },

    async matchIgnoreCase (r) {
      const match = new RegExp(r, "i");
      return merged(
        kubernetesSitesByUrl.keys().filter((url) => match.test(url)).
          map((url) => kubernetesSitesByUrl[url]),
        await Sites.find({
          url: { $regex: r, $options: "i" },
        }).fetchAsync());
    }
  }
})();

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
      let sites;
      if (queryParams && queryParams.site_url) {
        let siteUrl = queryParams.site_url;
        if (!(siteUrl.endsWith("/"))) {
          siteUrl = siteUrl + "/";
        }
        sites = await MergedSites.byUrl(siteUrl);
      } else if (queryParams?.search_url) {
        sites = await MergedSites.matchIgnoreCase(queryParams?.search_url);
      } else {
        sites = await MergedSites.allUndeleted();
      }

      let tags;
      if (queryParams?.tags) {
        if (!Array.isArray(queryParams.tags)) {
          queryParams.tags = [queryParams.tags];
        }
        tags = await Tags.find({$or: tags.flatMap((tag) => [
          { "name_en": tag },
          { "name_fr": tag }
        ]) }).fetchAsync();
      } else {
        tags = await Tags.find({}).fetchAsync();
      }

      const sitesByUrl = {};
      sites.forEach((site) => { sitesByUrl[site.url] = site; });
      for (const t of tags) {
        for (const url of t.sites) {
          if (! sitesByUrl[url]) continue;
          if (! sitesByUrl[url].tags) sitesByUrl[url].tags = new Set();
          sitesByUrl[url].tags.add(t);
        }
      }

      let sitesWithTags;
      if (queryParams?.tagged) {
        sitesWithTags = Object.values(sitesByUrl).filter((s) => s.tags);
      } else {
        sitesWithTags = Object.values(sitesByUrl);
      }

      // Convert sets to lists
      sitesWithTags.forEach((site) => {
        site.tags = site.tags ? site.tags.values() :  [];
      })

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


/**
 * Search for a specific text, or a list of tags, for element with at least a tag. Sort by title
 * @param {array=} lookup sites that have any of these tags (by default: that have any tag)
 */

async function searchSitesByTags(tags=[]) {
  const tagsRetained = {};
  tags.forEach((tag) => tagsRetained[tag] = 1);


  const tagsMongo = await Tags.find(tags.length ? {$or: tags.map((tag) => (
    { $or: [
      { "name_en": tag },
      { "name_fr": tag }
    ] }
  ))} : {}).fetchAsync();

  if (! tagsMongo) return [];

  // The set of URLs of sites that have all the requested tags:
  const matchingUrls = tagsMongo
    .map((tag) => new Set(tag.sites))
    .reduce((a, c) => a.intersection(c));

  const mongoSitesByUrl = {};
  (await Sites.findAllUndeleted()).foreach((site) => {
    mongoSitesByUrl[site.url] = site;
  });

  return matchingUrls.values().map((url) => {
    if (mongoSitesByUrl[url] || kubernetesSitesByUrl[url]) {
      const site = { ...(mongoSitesByUrl[url] || {}),
                     ...(kubernetesSitesByUrl[url] || {}) }
      site.tags = []

      for (const tag of tagsMongo) {
        if (tag.sites.find((url) => url === site.url)) {
          site.tags.push(tag)
        }
      }

      return site
    }
  }).filter((s) => s !== undefined);
}
