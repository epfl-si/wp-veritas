import { Categories, Sites } from "../../imports/api/collections";
import { formatSiteCategories } from "./utils";
import { REST, RESTError } from "../../imports/rest";

/**
 * @api {get} /categories  Get all categories
 * @apiGroup Categories
 *
 * @apiSuccessExample Success-Response:
 *
 *     HTTP/1.1 200 OK
 *     [
 *       ...,
 *       {
 *         "_id": "iygEnBWnFsc9yPcks",
 *         "name": "Inside"
 *       },
 *       ...,
 *     ]
 */
REST.addRoute(
  "categories",
  {
    get: async function() {
      return await Categories.find({}).fetchAsync();
    },
  }
);

/**
 * @api {get} /categories/:name  Get category by name
 * @apiGroup Categories
 *
 * @apiParam   {String} name  Category name.
 *
 * @apiSuccess {String} _id   Category ID.
 * @apiSuccess {String} name  Category name fr.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "iygEnBWnFsc9yPcks",
 *       "name": "Inside"
 *     }
 *
 * @apiError CategoryNotFound Category with this name wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "status": "CategoryNotFound",
 *       "message": "This category \"inside\" is unknown. Use api/v1/categories to list them."
 *     }
 */
REST.addRoute(
  "categories/:name",
  {
    get: async function ({ urlParams }) {
      try {
        return await Categories.findOneAsync({ name: urlParams.name });
        if (!result) {
          throw "result undefined";
        }
      } catch (error) {
        console.log(error);
        let msg = `This category "${urlParams.name}" is unknown. Use api/v1/categories to list them.`;
        return new RESTError("CategoryNotFound", msg);
      }
    },
  }
);

/**
 * @api {get} /categories/:name/sites  Get sites by category name
 * @apiGroup Categories
 *
 * @apiParam   {String} name  Category name.
 *
 * @apiSuccess {String} _id   Category ID.
 * @apiSuccess {String} name  Category name fr.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       ...,
 *       {
 *        "_id": "W9z7zvdZwidhxxGTD",
 *        "url": "https://inside.epfl.ch/portal-xaas",
 *        "tagline": "Portal-XaaS",
 *        "title": "IAAS",
 *        "openshiftEnv": "inside",
 *        "category": "Inside",
 *        "theme": "wp-theme-2018",
 *        "languages": [
 *          "en",
 *          "fr"
 *        ],
 *        "unitId": "13035",
 *        "snowNumber": "",
 *        "comment": "Site \"intranet\" en 2018 pour infrastructure IaaS",
 *        "createdDate": null,
 *        "tags": [],
 *        "monitorSite": false,
 *        "wpInfra": true,
 *        "categories": [
 *          "Inside"
 *        ],
 *        "professors": []
 *       },
 *       ...,
 *     ]
 *
 * @apiError CategoryNotFound Category with this name wasn't found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "status": "CategoryNotFound",
 *       "message": "This category \"inside\" is unknown. Use api/v1/categories to list them."
 *     }
 */
REST.addRoute(
  "categories/:name/sites",
  {
    get: async function({ urlParams }) {
      let categoryName;
      try {
        categoryName = (await Categories.findOneAsync({ name: urlParams.name })).name;
      } catch (error) {
        console.log(error);
        let msg = `This category "${urlParams.name}" is unknown. Use api/v1/categories to list them.`;
        return new RESTError("CategoryNotFound", msg);
      }
      return formatSiteCategories(
        await Sites.find({
          isDeleted: false,
          categories: { $elemMatch: { name: categoryName } },
        }).fetchAsync()
      );
    },
  }
);
