/* eslint-env mocha */
 
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Categories } from '../api/collections';
 
if (Meteor.isServer) {
  describe('Categories', () => {
    describe('methods', () => {

      const userId = Random.id();
      let categoryId;
      beforeEach(() => {
        
        // Delete all categories
        Categories.remove({});

        // Insert a new category
        categoryId = Categories.insert({
          name: "Test catégorie"
        });

      });

      it('can delete a category', () => { 

        // Find the internal implementation of the category method so we can
        // test it in isolation
        console.log(Meteor.server.method_handlers);
        const deleteCategory = Meteor.server.method_handlers['/categories/remove'];
 
        // Set up a fake method invocation that looks like what the method expects
        const invocation = { userId };
 
        // Run the method with `this` set to the fake invocation
        console.log(deleteCategory);
        console.log(invocation);
        console.log(categoryId);
        deleteCategory.apply(invocation, [categoryId]);
 
        // Verify that the method does what we expected
        assert.equal(Categories.find().count(), 0);
      });
    });
  });
}