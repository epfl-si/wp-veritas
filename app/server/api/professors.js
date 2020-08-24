import { Sites, Professors } from "../../imports/api/collections";
import { Api } from "./utils";

/**
 * @api {get} /professors  Get all professors
 * @apiGroup Professors
 *
 * @apiSuccessExample Success-Response:
 *
 *     HTTP/1.1 200 OK
 *     [
 *       ...,
 *       "_id": "iR6om6ryRuQLbWcyJ",
 *       "sciper": "188475",
 *       "displayName": "Charmier Grégory"
 *       ...,
 *     ]
 */
Api.addRoute(
  "professors",
  { authRequired: false },
  {
    get: function () {
      return Professors.find({}).fetch();
    },
  }
);


/**
 * @api {get} /professors/:sciper/tags  Get all tags for a professor
 * @apiGroup Professors
 *
 * @apiParam   {Number} sciper   Professor unique ID (sciper).
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
 *       ...,
 *       {
 *         "_id": "Rcbtik2F39dQT7scM",
 *         "name_fr": "Data management",
 *         "name_en": "Data management",
 *         "url_fr": "https://www.epfl.ch/research/domains/cluster?field-of-research=Data%20management",
 *         "url_en": "https://www.epfl.ch/research/domains/cluster?field-of-research=Data%20management",
 *         "type": "field-of-research"
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
 * @apiSampleRequest https://wp-veritas.epfl.ch/api/v1/professors/229105/tags
 */
Api.addRoute(
  "professors/:sciper/tags",
  { authRequired: false },
  {
    // @TODO: See https://github.com/epfl-si/wp-veritas/issues/99
    //        https://wp-veritas.epfl.ch/api/v1/professors/229105/tags vs https://wp-veritas.epfl.ch/api/v1/professors/toto/tags
    //        Error management
    get: function () {
      let sciper = this.urlParams.sciper;
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
