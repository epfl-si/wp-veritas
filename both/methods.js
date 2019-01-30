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

        sitesSchema.validate(site);

        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

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

        sitesSchema.validate(site);

        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

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

        check(siteId, String);
        
        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        Sites.remove({_id: siteId});
    },

    insertOpenshiftEnv(openshiftEnv) {

        openshiftEnvsSchema.validate(openshiftEnv);

        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        let openshiftEnvDocument = {
            name: openshiftEnv.name,
        };

        return OpenshiftEnvs.insert(openshiftEnvDocument);
    },

    removeOpenshiftEnv(openshiftEnvId){

        check(openshiftEnvId, String);
        
        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        OpenshiftEnvs.remove({_id: openshiftEnvId});
    },

    insertType(type) {

        typesSchema.validate(type);

        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        let typeDocument = {
            name: type.name,
        };

        return Types.insert(typeDocument);

    },

    removeType(typeId){

        check(typeId, String);
        
        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        Types.remove({_id: typeId});
    },

    insertTheme(theme) {

        themesSchema.validate(theme);

        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        let themeDocument = {
            name: theme.name,
        };

        return Themes.insert(themeDocument);

    },

    removeTheme(themeId){

        check(themeId, String);
        
        // TODO: Lorsque TEQUILA sera en place
        /*
        if (!this.userId) {
            throw new Meteor.Error('not connected');
        }*/

        Themes.remove({_id: themeId});
    },
});