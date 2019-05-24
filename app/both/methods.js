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
    tagSchema} from './collections';

import { check } from 'meteor/check'; 
import { throwMeteorError } from './error';

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
        console.log(`Slug: ${site.slug}`);
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
        Roles.setUserRoles(userId, [role], Roles.GLOBAL_GROUP); 
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
        
        return Tags.insert(tagDocument);
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
        
        Tags.update(
            {_id: tag._id}, 
            { $set: tagDocument
        });
        
        let sites = Sites.find();
        sites.forEach(function(site) {
            new_tags = [];
            site.tags.forEach(function(current_tag) {
                if (current_tag._id === tag._id) {
                    console.log(`TAG A mettre àjour ${current_tag._id} ${current_tag.name_fr}`);
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

        Tags.remove({_id: tagId});
        
        /* FIXME: Improve it with a 'complexe' mongo query like :
        Sites.update(
            {}, 
            { $pull: {
                    tags: tagId
                }
            },
            { multi: true}
        );
        */
        let sites = Sites.find();
        sites.forEach(function(site) {
            new_tags = [];
            site.tags.forEach(function(tag) {
                if (tag._id === tagId) {
                    console.log(`TAG A supprimer ${tag._id} ${tag.name_fr}`);
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
        }
        return Sites.insert(siteDocument);
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
        
        Sites.update(
            {_id: site._id}, 
            { $set: siteDocument
        });
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
        }
        
        Sites.update(
            {_id: site._id}, 
            { $set: siteDocument
        });

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

        Sites.remove({_id: siteId});
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

        return OpenshiftEnvs.insert(openshiftEnvDocument);
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

        OpenshiftEnvs.remove({_id: openshiftEnvId});
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

        return Types.insert(typeDocument);

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

        return Categories.insert(categoryDocument);

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

        Types.remove({_id: typeId});
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

        Categories.remove({_id: categoryId});
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

        return Themes.insert(themeDocument);
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

        Themes.remove({_id: themeId});
    },
});