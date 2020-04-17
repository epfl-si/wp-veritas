import { check } from 'meteor/check'; 
import { 
    Sites, 
    OpenshiftEnvs,
    Categories,
    Themes, 
    categoriesSchema,
    openshiftEnvsSchema, 
    themesSchema, 
    Professors,
    professorSchema
  } from '../api/collections';

import { sitesSchema } from './schemas/sitesSchema';
import { sitesWPInfraOutsideSchema } from './schemas/sitesWPInfraOutsideSchema';
import { throwMeteorError } from '../api/error';
import { AppLogger } from '../api/logger';

function prepareUpdateInsert(site, action) {

  if (site.userExperienceUniqueLabel == undefined) {
    site.userExperienceUniqueLabel = '';
  }

  // Delete "/" at the end of URL 
  let url = site.url;
  if (url.endsWith('/')) {
    site.url = url.slice(0, -1);
  }
  
  // Check if url is unique and if userExperienceUniqueLabel is unique
  // TODO: Move this code to SimpleSchema custom validation function
  if (action === 'update') {
    let sites = Sites.find({url:site.url});
    if (sites.count() > 1) {
      throwMeteorError('url', 'Cette URL existe déjà !');
    } else if (sites.count() == 1) {
      if (sites.fetch()[0]._id != site._id) {
        throwMeteorError('url', 'Cette URL existe déjà !');
      }
    }
    if (site.userExperienceUniqueLabel != '') {
      let sitesByUXUniqueLabel = Sites.find({userExperienceUniqueLabel:site.userExperienceUniqueLabel});
      if (sitesByUXUniqueLabel.count() > 1) {
        throwMeteorError('userExperienceUniqueLabel', 'Ce label existe déjà !');
      } else if (sitesByUXUniqueLabel.count() == 1) {
        if (sitesByUXUniqueLabel.fetch()[0]._id != site._id) {
          throwMeteorError('userExperienceUniqueLabel', 'Ce label existe déjà !');
        }
      }
    }
  } else {
    if (Sites.find({url:site.url}).count() > 0) {
      throwMeteorError('url', 'Cette URL existe déjà !');
    }

    if (site.userExperienceUniqueLabel != '' && Sites.find({userExperienceUniqueLabel:site.userExperienceUniqueLabel}).count() > 0) {
      throwMeteorError('userExperienceUniqueLabel', 'Ce label existe déjà !');
    }
  }

  if (site.tags == undefined) {
    site.tags = [];
  }

  if (site.userExperience == undefined) {
    site.userExperience = false;
  }

  return site;
}

function getUnitNames(unitId) {

  // Ldap search to get unitName and unitLevel2
  let unit = Meteor.apply('getUnitFromLDAP', [unitId], true);
  let unitName = '';
  let unitNameLevel2 = '';
  
  if ('cn' in unit) {
    unitName = unit.cn;
  }
  
  if ('dn' in unit) {
    let dn = unit.dn.split(",");
    if (dn.length == 5) {
      // dn[2] = 'ou=associations'
      unitNameLevel2 = dn[2].split("=")[1];
    }
  }

  return {
    unitName: unitName,
    unitNameLevel2: unitNameLevel2,
  };
}

Meteor.methods({

  async getUserFromLDAP(sciper) {
    let result;
    const publicLdapContext = require('epfl-ldap')();
    result = await new Promise(function (resolve, reject) {
      publicLdapContext.users.getUserBySciper(sciper, function(err, data) {
        resolve(data);
      });
    });
    return result;
  },
  
  async getUnitFromLDAP(uniqueIdentifier) {
    let result;
    const publicLdapContext = require('epfl-ldap')();
    result = await new Promise(function (resolve, reject) {
      publicLdapContext.units.getUnitByUniqueIdentifier(uniqueIdentifier, function(err, data) {
        resolve(data);
      });
    });
    return result;
  },

  updateLDAPInformations() {
    let professors = Professors.find({}).fetch();
    professors.forEach(prof => {
      Meteor.call('getUserFromLDAP', prof.sciper, (error, LDAPinformations) => {
        if (error) {
          console.log(`ERROR ${error}`);
        } else {
          let professorDocument = {
            displayName: LDAPinformations.displayName,
          }
          Professors.update(
            { _id: prof._id }, 
            { $set: professorDocument }
          );
        }
      });
    });
  },
  insertSite(site){
    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const canInsert = Roles.userIsInRole(
      this.userId,
      ['admin'], 
      Roles.GLOBAL_GROUP
    );

    if (! canInsert) {
      throw new Meteor.Error('unauthorized',
        'Only admins can insert sites.');
    }

    if (site.wpInfra) {
      sitesSchema.validate(site);
    } else {
      sitesWPInfraOutsideSchema.validate(site);
    }
    site = prepareUpdateInsert(site, 'insert');

    const { unitName, unitNameLevel2 } = getUnitNames(site.unitId);

    let siteDocument = {
      url: site.url,
      tagline: site.tagline,
      title: site.title,
      openshiftEnv: site.openshiftEnv,
      category: site.category,
      theme: site.theme,
      languages: site.languages,
      unitId: site.unitId,
      unitName: unitName,
      unitNameLevel2: unitNameLevel2,
      snowNumber: site.snowNumber,
      comment: site.comment,
      createdDate: new Date(),
      userExperience: site.userExperience,
      userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      tags: site.tags,
      professors: site.professors,
      wpInfra: site.wpInfra,
    }

    let newSiteId = Sites.insert(siteDocument);

    let newSite = Sites.findOne({_id: newSiteId});

    AppLogger.getLog().info(
      `Insert site ID ${ newSiteId }`, 
      { before: "", after: newSite }, 
      this.userId
    );

    return newSite;
  },

  associateProfessorsToSite(site, professors) {

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const canAssociate = Roles.userIsInRole(
      this.userId,
      ['admin', 'tags-editor'], 
      Roles.GLOBAL_GROUP
    );

    if (! canAssociate) {
      throw new Meteor.Error('unauthorized',
        'Only admins and editors can associate tags to a site.');
    }

    let siteDocument = {
      professors: professors,
    }

    let siteBeforeUpdate = Sites.findOne({ _id: site._id});
    
    Sites.update(
      {_id: site._id}, 
      { $set: siteDocument
    });

    let updatedSite = Sites.findOne({ _id: site._id});

    AppLogger.getLog().info(
      `Associate professors to site with ID ${ site._id }`, 
      { before: siteBeforeUpdate , after: updatedSite }, 
      this.userId
    );

  },

  associateTagsToSite(site, tags) {

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const canAssociate = Roles.userIsInRole(
      this.userId,
      ['admin', 'tags-editor'], 
      Roles.GLOBAL_GROUP
    );

    if (! canAssociate) {
      throw new Meteor.Error('unauthorized',
        'Only admins and editors can associate tags to a site.');
    }

    let siteDocument = {
      tags: tags,
    }

    let siteBeforeUpdate = Sites.findOne({ _id: site._id});
    
    Sites.update(
      {_id: site._id}, 
      { $set: siteDocument
    });

    let updatedSite = Sites.findOne({ _id: site._id});

    AppLogger.getLog().info(
      `Associate tags to site with ID ${ site._id }`, 
      { before: siteBeforeUpdate , after: updatedSite }, 
      this.userId
    );
      
  },
    
  updateSite(site) {

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const canUpdate = Roles.userIsInRole(
      this.userId,
      ['admin'], 
      Roles.GLOBAL_GROUP
    );

    if (! canUpdate) {
      throw new Meteor.Error('unauthorized',
        'Only admins can update sites.');
    }

    if (!('professors' in site)) {
      site.professors = [];
    }

    if (site.wpInfra) {
      sitesSchema.validate(site);
    } else {
      sitesWPInfraOutsideSchema.validate(site);
    }
    site = prepareUpdateInsert(site, 'update');

    const { unitName, unitNameLevel2 } = getUnitNames(site.unitId);

    let siteDocument = {
      url: site.url,
      tagline: site.tagline,
      title: site.title,
      openshiftEnv: site.openshiftEnv,
      category: site.category,
      theme: site.theme,
      languages: site.languages,
      unitId: site.unitId,
      unitName: unitName,
      unitNameLevel2: unitNameLevel2,
      snowNumber: site.snowNumber,
      comment: site.comment,
      createdDate: site.createdDate,
      userExperience: site.userExperience,
      userExperienceUniqueLabel: site.userExperienceUniqueLabel,
      tags: site.tags,
      professors: site.professors,
      wpInfra: site.wpInfra,
    }

    let siteBeforeUpdate = Sites.findOne({ _id: site._id});

    Sites.update(
      { _id: site._id }, 
      { $set: siteDocument }
    );
    
    let updatedSite = Sites.findOne({ _id: site._id});

    AppLogger.getLog().info(
      `Update site ID ${ site._id }`, 
      { before: siteBeforeUpdate , after: updatedSite }, 
      this.userId
    );

    return updatedSite;
  },
    
  removeSite(siteId){

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const canRemove = Roles.userIsInRole(
      this.userId,
      ['admin'], 
      Roles.GLOBAL_GROUP
    );

    if (! canRemove) {
      throw new Meteor.Error('unauthorized',
        'Only admins can remove sites.');
    }

    check(siteId, String);

    let site = Sites.findOne({_id: siteId});
    
    Sites.remove({_id: siteId});

    AppLogger.getLog().info(
      `Delete site ID ${ siteId }`, 
      { before: site, after: "" }, 
      this.userId
    );
  },

});