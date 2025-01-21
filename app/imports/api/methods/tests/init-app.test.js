// before(async () => {
//   await new Promise(resolve => setTimeout(resolve, 500));
// });

import { Meteor } from 'meteor/meteor';

// before((done) => {
//     // wait until all server modules are loaded (in Meteor.startup)
//     Meteor.startup(done);
// });

describe('Init', () => {
  before(done => {
    Meteor.startup(done);
  });

  it('Has Initiated', () => {
    console.log('Server is ready')
  });
});
