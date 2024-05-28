import { DDPRateLimiter } from "meteor/ddp-rate-limiter";
import { _ } from "meteor/underscore";

const rateLimiter = (methods) => {

  // Get list of all method names
  const METHODS = methods.map((m) => m.name);

  if (Meteor.isServer) {
    // Only allow 5 operations per connection per second
    DDPRateLimiter.addRule(
      {
        name(name) {
          return METHODS.includes(name);
        },

        // Rate limit per connection ID
        connectionId() {
          return true;
        },
      },
      5,
      1000
    );
  }
};

export { rateLimiter };
