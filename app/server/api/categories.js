import { Categories, Sites } from "../../imports/api/collections";
import { Api, APIError, formatSiteCategories } from "./utils";

/**
 * @api {get} /categories  Get all categories
 * @apiGroup Categories
 *
 * @apiSuccessExample Success-Response:
 *
 *     HTTP/1.1 200 OK
 *     [
 *       ...
 *       {
 *         "_id": "iygEnBWnFsc9yPcks",
 *         "name": "Inside"
 *       },
 *       ...
 *     ]
 */
Api.addRoute(
  "categories",
  { authRequired: false },
  {
    get: function () {
      return Categories.find({}).fetch();
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
Api.addRoute(
  "categories/:name",
  { authRequired: false },
  {
    get: function () {
      try {
        result = Categories.findOne({ name: this.urlParams.name });
        if (!result) {
          throw "result undefined";
        }
      } catch (error) {
        console.log(error);
        let msg = `This category "${this.urlParams.name}" is unknown. Use api/v1/categories to list them.`;
        return APIError("CategoryNotFound", msg);
      }
      return result;
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
 *        "userExperience": false,
 *        "unitName": "exheb",
 *        "unitNameLevel2": "si",
 *        "wpInfra": true,
 *        "userExperienceUniqueLabel": "",
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
Api.addRoute(
  "categories/:name/sites",
  { authRequired: false },
  {
    get: function () {
      let categoryName;
      try {
        categoryName = Categories.findOne({ name: this.urlParams.name }).name;
      } catch (error) {
        console.log(error);
        let msg = `This category "${this.urlParams.name}" is unknown. Use api/v1/categories to list them.`;
        return APIError("CategoryNotFound", msg);
      }
      return formatSiteCategories(
        Sites.find({
          categories: { $elemMatch: { name: categoryName } },
        }).fetch()
      );
    },
  }
);
