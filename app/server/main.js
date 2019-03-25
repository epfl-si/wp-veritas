import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Sites } from '../both';
import './publications';
import getUnits from './units';
import { importData } from './import-data';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let activeTequila = false;
let importDatas = true;
  
if (Meteor.isServer) {
  
  if (importDatas) {
    importData();
  }
  
  if (activeTequila) {

    Tequila.options.request = ['uniqueid', 'email'];

    // In Meteor.users documents, the _id is the user's SCIPER:
    Tequila.options.getUserId = function getUserId(tequilaResponse) {

      Meteor.users.upsert(
        { _id: tequilaResponse.uniqueid, },
        { 
          $set: { 
            username: tequilaResponse.user,
            emails: [tequilaResponse.email], 
          }
        }
      );
      
      // Add epfl-member by default
      if (!Roles.userIsInRole(tequilaResponse.uniqueid, ['admin', 'tags-editor', 'epfl-member'], Roles.GLOBAL_GROUP)) {
        Roles.addUsersToRoles(tequilaResponse.uniqueid, 'epfl-member', Roles.GLOBAL_GROUP);  
      }

      return tequilaResponse.uniqueid;
    }; 
  }

  // Global API configuration
  let Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true,
    version: 'v1'
  });

  // Maps to: /api/v1/sites
  // and to: /api/v1/sites?site_url=... to get a specific site
  Api.addRoute('sites', {authRequired: false}, {
    get: function () {
      // is that a id request from an url ?
      var query = this.queryParams;
      if (query && this.queryParams.site_url) {
        return Sites.findOne({'url': this.queryParams.site_url});
      } else {
        // nope, we are here for all the sites data
        return Sites.find({}).fetch();
      }
    }
  });

  // Maps to: /api/v1/sites/:id
  Api.addRoute('sites/:id', {authRequired: false}, {
    get: function () {
      return Sites.findOne(this.urlParams.id);
    }
  });

  /*
  // Maps to: /api/v1/sites/:title/tags
  Api.addRoute('sites-by-title/:title/tags', {authRequired: false}, {
    get: function () {
      let site = Sites.findOne({title: this.urlParams.title});
      return site.tags;
    }
  });
  */

  // Maps to: /api/v1/sites/:id/tags
  Api.addRoute('sites/:id/tags', {authRequired: false}, {
    get: function () {
      let site = Sites.findOne(this.urlParams.id);
      return site.tags;
    }
  });

  // Maps to: /api/v1/sites-with-tags-en/:tag1/:tag2
  Api.addRoute('sites-with-tags-en/:tag1/:tag2', {authRequired: false}, {
    get: function () {
      let tag1 = this.urlParams.tag1.toUpperCase();
      let tag2 = this.urlParams.tag2.toUpperCase();
      let sites = Sites.find({'tags.name_en': tag1, 'tags.name_en': tag2}).fetch();
      return sites;
    }
  });

  // Maps to: /api/v1/sites-with-tags-fr/:tag1/:tag2
  Api.addRoute('sites-with-tags-fr/:tag1/:tag2', {authRequired: false}, {
    get: function () {
      let tag1 = this.urlParams.tag1.toUpperCase();
      let tag2 = this.urlParams.tag2.toUpperCase();
      let sites = Sites.find({'tags.name_fr': tag1, 'tags.name_fr': tag2}).fetch();
      return sites;
    }
  });

  // Maps to: /api/v1/sites/wp-admin/:sciper
  Api.addRoute('sites/wp-admin/:sciper', {authRequired: false}, {
    get: function()  {
      
      // Get units of sciper 
      let units = getUnits(this.urlParams.sciper);
      console.log(units);
      
      // Get all sites whose unit is present in 'units' 
      let sites = Sites.find({unitId: { $in: units }}).fetch();

      // Create an array with only wp-admin URL 
      admins = [];
      for (let index in sites) {
        admins.push(sites[index].url + '/wp-admin');
      };

      return admins;
    }
  });
}