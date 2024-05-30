import { OpenshiftEnvs } from "../../imports/api/collections";
import { REST } from "../../imports/rest";

/**
 * @api {get} /openshiftenvs  Get all OpenShift environments
 * @apiGroup OpenShift
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
REST.addRoute(
    "openshiftenvs",
    {
      get: async function() {
        // @TODO: OpenShiftEnvNotFound
        return await OpenshiftEnvs.find({}).fetchAsync();
      },
    }
  );
  
  /**
   * @api {get} /openshiftenvs/:id  Get OpenShift environment by ID
   * @apiGroup OpenShift
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
  REST.addRoute(
    "openshiftenvs/:id",
    {
      get: async function ({ urlParams }) {
        // @TODO: OpenShiftEnvNotFound
        return await OpenshiftEnvs.findOneAsync(urlParams.id);
      },
    }
  );
