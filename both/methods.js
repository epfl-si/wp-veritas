import { 
    Sites, 
    OpenshiftEnvs, 
    Types, 
    Themes, 
    sitesSchema, 
    openshiftEnvsSchema, 
    typesSchema, 
    themesSchema } from './collections';

import { check } from 'meteor/check'; 
import { throwMeteorError } from './error';


function prepareUpdateInsert(site, action) {

    // Delete "/" at the end of URL 
    let url = site.url;
    if (url.endsWith('/')) {
        site.url = url.slice(0, -1);
    }
    
    // Check if url is unique
    // TODO: Move this code to SimpleSchema custom validation function
    let sites_number_with_same_url;

    if (action === 'update') {
        sites_number_with_same_url = 1;
    } else {
        sites_number_with_same_url = 0;
    }
    
    if (Sites.find({url:site.url}).count() > sites_number_with_same_url) {
        throwMeteorError('url', 'Cette URL existe déjà !');
    }

    if (site.status === 'requested') {
        site.requestedDate = new Date();
    } else {
        site.requestedDate = null;
    }

    if (site.status === 'created') {
        site.createdDate = new Date();
    } else {
        site.createdDate = null;
    }
    
    if (site.status === 'archived') {
        site.archivedDate = new Date();
    } else {
        site.archivedDate = null;
    }

    if (site.status === 'trashed') {
        site.trashedDate = new Date();
    } else {
        site.trashedDate = null;
    }
    return site;
}

Meteor.methods({

    insertSite(site){
        
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }

        sitesSchema.validate(site);

        site = prepareUpdateInsert(site, 'insert');
        
        let siteDocument = {
            url: site.url,
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
        }

        return Sites.insert(siteDocument);
    },
    
    updateSite(site){

        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }

        sitesSchema.validate(site);

        site = prepareUpdateInsert(site, 'update');

        let siteDocument = {
            url: site.url,
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
            comment: site.comment,
            plannedClosingDate: site.plannedClosingDate
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

        check(siteId, String);

        Sites.remove({_id: siteId});
    },

    insertOpenshiftEnv(openshiftEnv) {

        if (!this.userId) {
            throw new Meteor.Error('not connected');
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

        check(openshiftEnvId, String);

        OpenshiftEnvs.remove({_id: openshiftEnvId});
    },

    insertType(type) {

        if (!this.userId) {
            throw new Meteor.Error('not connected');
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

    removeType(typeId){

        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }

        check(typeId, String);

        Types.remove({_id: typeId});
    },

    insertTheme(theme) {

        if (!this.userId) {
            throw new Meteor.Error('not connected');
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

        check(themeId, String);

        Themes.remove({_id: themeId});
    },
});