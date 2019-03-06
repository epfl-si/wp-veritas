import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Sites } from '../both';
import './publications';
import getUnits from './units';

// Define lang <html lang="fr" />
WebApp.addHtmlAttributeHook(() => ({ lang: 'fr' }));

let activeTequila = false;
  
if (Meteor.isServer) {

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
    prettyJson: true
  });

  // Maps to: /api/sites
  // and to: /api/sites?site_url=... to get a specific site
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

  // Maps to: /api/sites/:id
  Api.addRoute('sites/:id', {authRequired: false}, {
    get: function () {
      return Sites.findOne(this.urlParams.id);
    }
  });

  // Maps to: /api/sites/:id/tags
  Api.addRoute('sites/:id/tags', {authRequired: false}, {
    get: function () {
      let site = Sites.findOne(this.urlParams.id);
      return site.tags;
    }
  });

  // Maps to: /api/sites-with-tags/:tag1/:tag2
  Api.addRoute('sites-with-tags/:tag1/:tag2', {authRequired: false}, {
    get: function () {
      let tag1 = this.urlParams.tag1.toUpperCase();
      let tag2 = this.urlParams.tag2.toUpperCase();
      let sites = Sites.find({'tags.name': tag1, 'tags.name': tag2}).fetch();
      return sites;
    }
  });

  // Maps to: /api/sites/wp-admin/:sciper
  Api.addRoute('sites/wp-admin/:sciper', {authRequired: false}, {
    get: function()  {
      
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


importVeritas = () => {
  const path = 'source-veritas.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      
      let data = JSON.parse(JSON.stringify(results.data));
     
      let index = 0;
      data.forEach(site => {
        index = index + 1;
        console.log(index);

        let langs;
        if (site.langs == 'fr' || site.langs == 'en') {
          langs = [site.langs];
        } else {
          langs = site.langs.split(',')
        }

        let siteDocument = {
          url: site.wp_site_url,
          tagline: site.wp_tagline,
          title: site.wp_site_title,
          openshiftEnv: site.openshift_env,
          type: 'public',
          category: null,
          theme: site.theme,
          faculty: site.theme_faculty,
          languages: langs,
          unitId: site.unit_id,
          snowNumber: '',
          status: 'created',
          comment: '',
          plannedClosingDate: null,
          requestedDate: null,
          createdDate: null,
          archivedDate: null,
          trashedDate: null,
          tags: [],
        }

        if (!Sites.findOne({url: siteDocument.url})) {
          Sites.insert(siteDocument);
        }
      });
      console.log("Importation veritas finished");
    }    
  });
}

}
