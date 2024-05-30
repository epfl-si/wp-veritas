import MakaRest from 'meteor/maka:rest';
import { match } from 'path-to-regexp';

export const RESTError = (status, message, statusCode = 404) => {
  this.statusCode = statusCode;
  this.data = { status, message };
};

export const REST = new MakaRest({
  useDefaultAuth: true,
  prettyJson: true,
  isRoot: true  // Meaning that the path is at /api/v1. I mean, it makes *some* sense
                // once you figure it out, which the doc won't help you to.
});

const addRouteOrig = REST.addRoute.bind(REST);

REST.addRoute = function(path, options) {
  let matcher;
  if (path.includes('/:')) {
    matcher = match(`/api/v1/${path}`);
  }
  async function get (params) {
    const matched = {};
    if (matcher && params.request && params.request.originalUrl) {
      const matched = matcher(params.request.originalUrl);
      if (matched) {
        params.urlParams = matched.params;
      } else {
        console.error(`Failed to match ${params.request.originalUrl} with ${path}`);
      }
    }
    const result = await options.get.call(this, params);
    if (result instanceof RESTError) {
      return result;
    } else {
      return {
        statusCode: 200,
        data: result
      }
    }
  }

  addRouteOrig(path, { authRequired: false }, { get });
};
