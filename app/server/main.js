import Tequila from "meteor/epfl:accounts-tequila";
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Sites, OpenshiftEnvs } from '../imports/api/collections';
import '../imports/api/methods'; // Call meteor methods backend
import './publications'; // Call meteor publications backend
import getUnits from './units';
import { importData } from './import-data';
import './indexes';
import { AppLogger } from './logger';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let activeTequila = true;
let importDatas = false;
  
if (Meteor.isServer) {

  new AppLogger();

  if (importDatas) {
    importData();
  }
  
  if (activeTequila) {
    Tequila.start({
      service: 'wp-veritas',
      request: ['uniqueid', 'email'],
      bypass: ['/api'],
      getUserId(tequila) {
        if (tequila.uniqueid == "188475") {
          Roles.setUserRoles(tequila.uniqueid, ['editor'], Roles.GLOBAL_GROUP); 
          Roles.setUserRoles(tequila.uniqueid, ['admin'], Roles.GLOBAL_GROUP); 
        }
        // Add epfl-member by default
        if (!Roles.userIsInRole(tequila.uniqueid, ['admin', 'tags-editor', 'epfl-member'], Roles.GLOBAL_GROUP)) {
          Roles.addUsersToRoles(tequila.uniqueid, 'epfl-member', Roles.GLOBAL_GROUP);  
        }
        return tequila.uniqueid;
      },
      upsert: (tequila) => ({ $set: {
        profile: {
          sciper: tequila.uniqueid
        },
        username: tequila.user,
        emails: [ tequila.email ],
      }}),
    }); 
  }

  // Global API configuration
  let Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true,
    version: 'v1'
  });

  // Maps to: /api/v1/sites
  // and to: /api/v1/sites?site_url=... to get a specific site
  // and to: /api/v1/sites?text=... to search a list of sites from a text with status "created" or "no-wordpress"
  // and to: /api/v1/sites?tags=... to search a list of sites from an array of tags with status "created" or "no-wordpress"
  // and to: /api/v1/sites?tagged=true to retrieve the list of sites with at least a tag with status "created" or "no-wordpress"
  Api.addRoute('sites', {authRequired: false}, {
    get: function () {
      // is that a id request from an url ?
      var query = this.queryParams;

      if (query && this.queryParams.site_url) {
        return Sites.findOne({'url': this.queryParams.site_url});
      } else if (query && (this.queryParams.text || this.queryParams.tags)) {
        if (this.queryParams.tags && !(Array.isArray(this.queryParams.tags))) {
          this.queryParams.tags = [this.queryParams.tags];
        }
        return Sites.tagged_search(this.queryParams.text, this.queryParams.tags);
      } else if (query && (this.queryParams.tagged)) {
        return Sites.tagged_search();
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
    get: function() {
      
      // Get units of sciper 
      let units = getUnits(this.urlParams.sciper);
      
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

  // Maps to: /api/v1/openshiftenvs/
  Api.addRoute('openshiftenvs', {authRequired: false}, {
    get: function() {
      return OpenshiftEnvs.find({}).fetch();
    }
  });

  // Maps to: /api/v1/openshiftenvs/:id
  Api.addRoute('openshiftenvs/:id', {authRequired: false}, {
    get: function () {
      return OpenshiftEnvs.findOne(this.urlParams.id);
    }
  });
}
