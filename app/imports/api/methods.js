import { check } from 'meteor/check'; 
import { 
    Sites, 
    OpenshiftEnvs,
    Categories,
    Themes, 
    categoriesSchema,
    openshiftEnvsSchema, 
    themesSchema, 
    Tags,
    tagSchema, 
    Professors,
    professorSchema
  } from '../api/collections';

import { sitesSchema } from './schemas/sitesSchema';
import { sitesWPInfraOutsideSchema } from './schemas/sitesWPInfraOutsideSchema';
import { throwMeteorError } from '../api/error';
import { AppLogger } from '../../server/logger';

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

  insertTag(tag){
        
    if (!this.userId) {
        throw new Meteor.Error('not connected');
    }

    const canInsert = Roles.userIsInRole(
        this.userId,
        ['admin', 'tags-editor'], 
        Roles.GLOBAL_GROUP
    );

    if (! canInsert) {
        throw new Meteor.Error('unauthorized',
          'Only admins and editors can insert tags.');
    }

    tagSchema.validate(tag);

    // Check if name is unique
    // TODO: Move this code to SimpleSchema custom validation function
    if (Tags.find({name: tag.name_fr}).count()>0) {
        throwMeteorError('name_fr', 'Nom [FR] du type existe déjà !');
    }
    if (Tags.find({name: tag.name_en}).count()>0) {
        throwMeteorError('name_en', 'Nom [EN] du type existe déjà !');
    }

    let tagDocument = {
        name_fr: tag.name_fr,
        name_en: tag.name_en,
        url_fr: tag.url_fr,
        url_en: tag.url_en,
        type: tag.type
    }

    let newtag = Tags.insert(tagDocument);

    AppLogger.getLog().info(
      `Insert tag ID ${ newtag._id }`, 
      { before: "", after: newtag }, 
      this.userId
    );
    
    return newtag;
  },

  updateTag(tag){

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const canUpdate = Roles.userIsInRole(
      this.userId,
      ['admin', 'tags-editor'], 
      Roles.GLOBAL_GROUP
    );

    if (! canUpdate) {
      throw new Meteor.Error('unauthorized',
        'Only admins and editors can update tags.');
    }

    tagSchema.validate(tag);

    let tagDocument = {
      name_fr: tag.name_fr,
      name_en: tag.name_en,
      url_fr: tag.url_fr,
      url_en: tag.url_en,
      type: tag.type
    }
    
    let tagBeforeUpdate = Tags.findOne({_id: tag._id});

    Tags.update(
      { _id: tag._id }, 
      { $set: tagDocument }
    );

    let updatedTag = Tags.findOne({_id: tag._id});

    AppLogger.getLog().info(
      `Update tag ID ${ tag._id }`, 
      { before: tagBeforeUpdate , after: updatedTag }, 
      this.userId
    );
    
    // we need update all sites that have this updated tag
    let sites = Sites.find({}).fetch();
    sites.forEach(function(site) {
      new_tags = [];
      site.tags.forEach(function(current_tag) {
        if (current_tag._id === tag._id) {
          // we want update this tag of current site
          new_tags.push(tag);
        } else {
          new_tags.push(current_tag);
        }
      });
      Sites.update(
        {"_id": site._id},
        {
          $set: {
            'tags': new_tags,
          }
        }
      );
    });
  },

  removeTag(tagId){

    if (!this.userId) {
        throw new Meteor.Error('not connected');
    }

    const canRemove = Roles.userIsInRole(
        this.userId,
        ['admin', 'tags-editor'], 
        Roles.GLOBAL_GROUP
    );

    if (! canRemove) {
        throw new Meteor.Error('unauthorized',
          'Only admins and editors can remove tags.');
    }

    check(tagId, String);

    let tagBeforeDelete = Tags.findOne({_id: tagId});

    Tags.remove({_id: tagId});

    AppLogger.getLog().info(
      `Remove tag ID ${ tagId }`,
      { before: tagBeforeDelete , after: "" },
      this.userId
    );

    // we need update all sites that have this deleted tag
    let sites = Sites.find({}).fetch();
    sites.forEach(function(site) {
      new_tags = [];
      site.tags.forEach(function(tag) {
        if (tag._id === tagId) {
          // we want delete this tag of current site
        } else {
          new_tags.push(tag);
        }
      });
      Sites.update(
        {"_id": site._id},
        {
          $set: {
            'tags': new_tags,
          }
        }
      );
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

  insertOpenshiftEnv(openshiftEnv) {

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
        'Only admins can insert openShiftEnv.');
    }

    openshiftEnvsSchema.validate(openshiftEnv);
    
    // Check if name is unique
    // TODO: Move this code to SimpleSchema custom validation function
    if (OpenshiftEnvs.find({name:openshiftEnv.name}).count()>0) {
      throwMeteorError('name', 'Cet environnement openshift existe déjà !');
    }
    
    let openshiftEnvDocument = {
        name: openshiftEnv.name,
    };

    let newOpenshiftEnvsId = OpenshiftEnvs.insert(openshiftEnvDocument);
    let newOpenshiftEnvs = OpenshiftEnvs.findOne({ _id: newOpenshiftEnvsId });

    AppLogger.getLog().info(
      `Insert openshiftEnvs ID ${ newOpenshiftEnvsId }`, 
      { before: "", after: newOpenshiftEnvs }, 
      this.userId
    );

    return newOpenshiftEnvsId;
  },

  removeOpenshiftEnv(openshiftEnvId){

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
        'Only admins can remove openShiftEnv.');
    }

    check(openshiftEnvId, String);

    let openshiftEnv = OpenshiftEnvs.findOne({_id: openshiftEnvId});
    OpenshiftEnvs.remove({_id: openshiftEnvId});

    AppLogger.getLog().info(
      `Delete openshiftEnv ID ${ openshiftEnvId }`, 
      { before: openshiftEnv, after: "" }, 
      this.userId
    );
  },

  insertCategory(category) {

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
          'Only admins can insert category.');
    }

    // Check if name is unique
    // TODO: Move this code to SimpleSchema custom validation function
    if (Categories.find({name: category.name}).count()>0) {
        throwMeteorError('name', 'Nom de la catégorie existe déjà !');
    }

    categoriesSchema.validate(category);

    let categoryDocument = {
        name: category.name,
    };

    let newCategoryId = Categories.insert(categoryDocument);
    let newCategory = Categories.findOne({_id: newCategoryId});

    AppLogger.getLog().info(
      `Insert category ID ${ newCategory._id }`, 
      { before: "", after: newCategory }, 
      this.userId
    );

    return newCategoryId;

  },

  removeCategory(categoryId){

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
        'Only admins can remove Category.');
    }

    check(categoryId, String);

    let category = Categories.findOne({_id: categoryId});
    Categories.remove({_id: categoryId});

    AppLogger.getLog().info(
      `Delete category ID associateProfessorsToSite${ categoryId }`, 
      { before: category, after: "" }, 
      this.userId
    );
  },

  insertTheme(theme) {

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
        'Only admins can insert Theme.');
    }

    themesSchema.validate(theme);

    // Check if name is unique
    // TODO: Move this code to SimpleSchema custom validation function
    if (Themes.find({name: theme.name}).count()>0) {
        throwMeteorError('name', 'Nom du thème existe déjà !');
    }

    let themeDocument = {
        name: theme.name,
    };

    let newThemeId = Themes.insert(themeDocument);
    let newTheme = Themes.findOne({_id: newThemeId});

    AppLogger.getLog().info(
      `Insert theme ID ${ newThemeId }`, 
      { before: "", after: newTheme }, 
      this.userId
    );

    return newTheme;
  },

  removeTheme(themeId){

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const removeTheme = Roles.userIsInRole(
      this.userId,
      ['admin'], 
      Roles.GLOBAL_GROUP
    );

    if (! removeTheme) {
      throw new Meteor.Error('unauthorized',
        'Only admins can remove Theme.');
    }

    check(themeId, String);

    let theme = Themes.findOne({_id: themeId});

    Themes.remove({_id: themeId});

    AppLogger.getLog().info(
      `Delete theme ID ${ themeId }`, 
      { before: theme, after: "" }, 
      this.userId
    );
  },

  insertProfessor(professor) {
    
    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }
    
    const canInsert = Roles.userIsInRole(
      this.userId,
      ['admin', 'tags-editor'], 
      Roles.GLOBAL_GROUP
    );
    
    if (! canInsert) {
      throw new Meteor.Error('unauthorized',
        'Only admins and tags-editors can insert professor.');
    }
    
    professorSchema.validate(professor);
    
    // Check if name is unique
    // TODO: Move this code to SimpleSchema custom validation function
    if (Professors.find({sciper: professor.sciper}).count()>0) {
      throwMeteorError('name', 'Un professeur avec le même sciper existe déjà !');
    }
    
    let professorDocument = {
      sciper: professor.sciper,
      displayName: professor.displayName,
    };
    
    let newProfessorId = Professors.insert(professorDocument);
    let newProfessor = Professors.findOne({_id: newProfessorId});

    AppLogger.getLog().info(
      `Insert professor ID ${ newProfessorId }`, 
      { before: "", after: newProfessor }, 
      this.userId
    );

    return newProfessor;
  },

  updateProfessor(professor) {

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }
    
    const canUpdate = Roles.userIsInRole(
      this.userId,
      ['admin', 'tags-editor'], 
      Roles.GLOBAL_GROUP
    );
    
    if (! canUpdate) {
      throw new Meteor.Error('unauthorized',
        'Only admins and tags-editors can update professors.');
    }

    professorSchema.validate(professor);

    let professorDocument = {
      sciper: professor.sciper,
    }

    let professorBeforeUpdate = Professors.findOne({ _id: professor._id});

    Professors.update(
      { _id: professor._id }, 
      { $set: professorDocument }
    );

    let updatedProfessor = Professors.findOne({ _id: professor._id});
    
    AppLogger.getLog().info(
      `Update professor ID ${ professor._id }`, 
      { before: professorBeforeUpdate , after: updatedProfessor }, 
      this.userId
    );
  },

  removeProfessor(professorId){

    if (!this.userId) {
      throw new Meteor.Error('not connected');
    }

    const removeProfessor = Roles.userIsInRole(
      this.userId,
      ['admin', 'tags-editor'], 
      Roles.GLOBAL_GROUP
    );

    if (! removeProfessor) {
      throw new Meteor.Error('unauthorized',
        'Only admins and tags-editor can remove professor.');
    }

    check(professorId, String);

    let professor = Professors.findOne({_id: professorId});

    Professors.remove({_id: professorId});

    AppLogger.getLog().info(
      `Delete professor ID ${ professorId }`, 
      { before: professor, after: "" }, 
      this.userId
    );
    
    // we need update all sites that have this deleted professor
    let sites = Sites.find({}).fetch();
    sites.forEach(function(site) {
      new_professors = [];
      if ('professors' in site) {
        site.professors.forEach(function(professor) {
          if (professor._id === professorId) {
            // we want delete this tag of current professor
          } else {
            new_professors.push(professor);
          }
        });
        Sites.update(
          {"_id": site._id},
          {
            $set: {
              'professors': new_professors,
            }
          }
        );
      }
    });
  },
});