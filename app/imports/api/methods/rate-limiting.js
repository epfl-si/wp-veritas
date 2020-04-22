import { DDPRateLimiter } from "meteor/ddp-rate-limiter";
import { _ } from "meteor/underscore";

const rateLimiter = (methods) => {

  // Get list of all method names
  const METHODS = _.pluck(methods, "name");

  if (Meteor.isServer) {
    // Only allow 5 todos operations per connection per second
    DDPRateLimiter.addRule(
      {
        name(name) {
          return _.contains(METHODS, name);
        },

        // Rate limit per connection ID
        connectionId() {
          return true;
        },
      },
      1,
      600000
    );
  }
};

export { rateLimiter };
