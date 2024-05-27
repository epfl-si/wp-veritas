import { Sites, Tags } from "../../imports/api/collections";
import { Api } from "./utils";

/**
 * @api {get} /tags  Get all tags
 * @apiGroup Tags
 */
// Maps to: /api/v1/tags/
// Maps to: /api/v1/tags/?type=<type>
Api.addRoute(
    "tags",
    { authRequired: false },
    {
      get: async function() {
        var query = this.queryParams;
        if (query && this.queryParams.type) {
          return await Tags.find({ type: this.queryParams.type }).fetchAsync();
        }
        return await Tags.find({}).fetchAsync();
      },
    }
  );
  
  /**
   * @api {get} /tags/:id  Get tag by ID
   * @apiGroup Tags
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
   * @api {get} /tags/:id/clusters-and-professors  TODO -  Return all tags of 'field-of-research' type of tag STI
   * @apiGroup Tags
   */
  // Maps to: /api/v1/tags/:id/field-of-research
  // Example: Return all tags of 'field-of-research' type of tag STI
  Api.addRoute(
    "tags/:id/clusters-and-professors",
    { authRequired: false },
    {
      get: async function() {
        // Récupère le tag passé en paramètre. Par exemple: STI
        let tagId = this.urlParams.id;
  
        // Récupère tous les sites qui ont le tag STI
        let sites = await Sites.find({ isDeleted: false, "tags._id": tagId }).fetchAsync();
  
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