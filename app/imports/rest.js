import MakaRest from 'meteor/maka:rest';

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

REST.addRoute = function(name, options) {
  async function get (...args) {
    const result = await options.get.apply(this, args);
    if (result instanceof RESTError) {
      return result;
    } else {
      return {
        statusCode: 200,
        data: result
      }
    }
  }

  addRouteOrig(name, { authRequired: false }, { get });
};
