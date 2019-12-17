import { 
    Sites, 
    OpenshiftEnvs, 
    Types,
    Categories,
    Themes, 
    categoriesSchema,
    sitesSchema, 
    openshiftEnvsSchema, 
    typesSchema, 
    themesSchema, 
    Tags,
    tagSchema, 
    Professors,
    professorSchema
  } from '../api/collections';

import { check } from 'meteor/check'; 
import { throwMeteorError } from '../api/error';
import { AppLogger } from '../../server/logger';

function prepareUpdateInsert(site, action) {

  if (site.slug == undefined) {
    site.slug = '';
  }

  // Delete "/" at the end of URL 
  let url = site.url;
  if (url.endsWith('/')) {
    site.url = url.slice(0, -1);
  }
  
  // Check if url is unique and if slug is unique
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
    if (site.slug != '') {
      let sitesBySlug = Sites.find({slug:site.slug});
      if (sitesBySlug.count() > 1) {
        throwMeteorError('slug', 'Ce slug existe déjà !');
      } else if (sitesBySlug.count() == 1) {
        if (sitesBySlug.fetch()[0]._id != site._id) {
          throwMeteorError('slug', 'Ce slug existe déjà !');
        }
      }
    }
  } else {
    if (Sites.find({url:site.url}).count() > 0) {
      throwMeteorError('url', 'Cette URL existe déjà !');
    }

    if (site.slug != '' && Sites.find({slug:site.slug}).count() > 0) {
      throwMeteorError('slug', 'Ce slug existe déjà !');
    }
  }

  let currentSite = Sites.findOne({url:site.url});

  if (site.status == 'requested') {
    site.requestedDate = new Date();
  } else {
    if (currentSite == undefined) {
      site.requestedDate = null;
    } else {
      site.requestedDate = currentSite.requestedDate;
    }
  }

  if (site.status == 'created') {
    site.createdDate = new Date();
  } else {
    if (currentSite == undefined) {
      site.createdDate = null;
    } else {
      site.createdDate = currentSite.createdDate;
    }
  }
    
  if (site.status == 'archived') {
    site.archivedDate = new Date();
  } else {
    if (currentSite == undefined) {
      site.archivedDate = null;
    } else {
      site.archivedDate = currentSite.archivedDate;
    }
  }

  if (site.status == 'trashed') {
    site.trashedDate = new Date();
  } else {
    if (currentSite == undefined) {
      site.trashedDate = null;
    } else {
      site.trashedDate = currentSite.trashedDate;
    }
  }

  if (site.status == 'in-preparation') {
    site.inPreparationDate = new Date();
  } else {
    if (currentSite == undefined) {
      site.inPreparationDate = null;
    } else {
      site.inPreparationDate = currentSite.inPreparationDate;
    }
  }

  if (site.status == 'no-wordpress') {
    site.noWordPressDate = new Date();
  } else {
    if (currentSite == undefined) {
      site.noWordPressDate = null;
    } else {
      site.noWordPressDate = currentSite.noWordPressDate;
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

Meteor.methods({

  async getLDAPInformations(sciper) {
    let result;
    const publicLdapContext = require('epfl-ldap')();
    result = await new Promise(function (resolve, reject) {
      publicLdapContext.users.getUserBySciper(sciper, function(err, data) {
        resolve(data);
      });
    });
    return result;
  },

  async updateLDAPInformations() {
    let professors = Professors.find({}).fetch();
    professors.forEach(prof => {
      Meteor.call('getLDAPInformations', prof.sciper, (error, LDAPinformations) => {
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

  updateRole(userId, role) {
      
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
        'Only admins can update roles.');
    }
    
    let roleBeforeUpdate = Roles.getRolesForUser(userId);

    Roles.setUserRoles(userId, [role], Roles.GLOBAL_GROUP);

    AppLogger.getLog().info(
      `Update role ID ${ userId }`, 
      { before: roleBeforeUpdate, after: [role] },
      userId
    );
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

    sitesSchema.validate(site);

    site = prepareUpdateInsert(site, 'insert');

    let siteDocument = {
      url: site.url,
      slug: site.slug,
      tagline: site.tagline,
      title: site.title,
      openshiftEnv: site.openshiftEnv,
      type: site.type,
      category: site.category,
      theme: site.theme,
      faculty: site.faculty,
      languages: site.languages,
      unitId: site.unitId,
      snowNumber: site.snowNumber,
      status: site.status,
      comment: site.comment,
      plannedClosingDate: site.plannedClosingDate,
      requestedDate: site.requestedDate,
      createdDate: site.createdDate,
      archivedDate: site.archivedDate,
      trashedDate: site.trashedDate,
      noWordPressDate: site.noWordPressDate,
      inPreparationDate: site.inPreparationDate,
      userExperience: site.userExperience,
      tags: site.tags,
      professors: site.professors,
    }

    let newSiteId = Sites.insert(siteDocument);

    let newSite = Sites.findOne({_id: newSiteId});

    AppLogger.getLog().info(
      `Insert site ID ${ newSiteId }`, 
      { before: "", after: newSite }, 
      this.userId
    );

    return newSiteId;
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

    sitesSchema.validate(site);

    site = prepareUpdateInsert(site, 'update');

    let siteDocument = {
      url: site.url,
      slug: site.slug,
      tagline: site.tagline,
      title: site.title,
      openshiftEnv: site.openshiftEnv,
      type: site.type,
      category: site.category,
      theme: site.theme,
      faculty: site.faculty,
      languages: site.languages,
      unitId: site.unitId,
      snowNumber: site.snowNumber,
      status: site.status,
      comment: site.comment,
      plannedClosingDate: site.plannedClosingDate,
      requestedDate: site.requestedDate,
      createdDate: site.createdDate,
      archivedDate: site.archivedDate,
      trashedDate: site.trashedDate,
      noWordPressDate: site.noWordPressDate,
      inPreparationDate: site.inPreparationDate,
      userExperience: site.userExperience,
      tags: site.tags,
      professors: site.professors,
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

  insertType(type) {

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
        'Only admins can insert Type.');
    }

    // Check if name is unique
    // TODO: Move this code to SimpleSchema custom validation function
    if (Types.find({name: type.name}).count()>0) {
      throwMeteorError('name', 'Nom du type existe déjà !');
    }

    typesSchema.validate(type);

    let typeDocument = {
      name: type.name,
    };
    
    let newTypeId = Types.insert(typeDocument);
    let newType = Types.findOne({_id: newTypeId});

    AppLogger.getLog().info(
      `Insert type ID ${ newType._id }`, 
      { before: "", after: newType }, 
      this.userId
    );

    return newType;
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

  removeType(typeId){

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
          'Only admins can remove Type.');
    }

    check(typeId, String);

    let type = Types.findOne({_id: typeId});
    Types.remove({_id: typeId});

    AppLogger.getLog().info(
      `Delete type ID ${ typeId }`, 
      { before: type, after: "" }, 
      this.userId
    );
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
    });
  },
});