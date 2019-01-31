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

Meteor.methods({

    insertSite(site){
        
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }

        sitesSchema.validate(site);

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

        return Sites.insert(siteDocument);
    },
    
    updateSite(site){

        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }

        sitesSchema.validate(site);

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