import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';

export const openshiftEnvsSchema = new SimpleSchema({
    name: {
        type: String,
        min: 3,
    }
}, { check });

export const typesSchema = new SimpleSchema({
    name: {
        type: String,
        min: 3,
    }
}, { check });

export const themesSchema = new SimpleSchema({
    name: {
        type: String,
        min: 3,
    }
}, { check });

/**
 * Le schéma sitesSchema a pour but de valider les données avant de les insérer dans MongoDB.
 * 
 * A noter le dernier paramètre { check } qui permet, grâce au package audit-argument-checks,
 * d'avoir des warnings en cas d'un champ qui ne respecte pas le schéma définit ici.
 * 
 * TODO: Voir si on peut optimiser le type des champs. Exemple: URL ?, Date ?, etc
 */
export const sitesSchema = new SimpleSchema({
    // _id use to update a site
    _id: {
        type: String,
        optional: true,
    },
    url: {
        type: String,
        optional: false,
        max: 100,
        min: 19, // https://www.epfl.ch is the minimum
    }, 
    tagline: {
        type: String,
        optional: true,
        max: 100,
        min: 3,
    },
    title: {
        type: String,
        optional: false,
        max: 100,
        min: 3,
    },
    openshiftEnv: {
        type: String,
        optional: false,
        max: 100,
        min: 3,
    },
    type: {
        type: String,
        optional: false,
        max: 100,
        min: 3,
    },
    category: {
        type: String,
        optional: true,
        max: 100,
        min: 3,
    }, 
    theme: {
        type: String,
        optional: false,
        max: 100,
        min: 3,
    },
    faculty: {
        type: String,
        optional: true,
        min: 2,
        max: 100,
    },
    languages: {
        type: Array,
    },
    'languages.$': String,
    unitId: {
        type: String,
        optional: false,
        min: 3,
        max: 100,
    },
    snowNumber: {
        type: String,
        optional: true,
        min: 3,
        max: 100,
    },
    comment: {
        type: String,
        optional: true,
        min: 3,
        max: 255,
    },
    plannedClosingDate: {
        type: String,
        optional: true,
    }
}, { check });

export const Sites = new Mongo.Collection('sites');
export const OpenshiftEnvs = new Mongo.Collection('openshift-envs');
export const Types = new Mongo.Collection('types');
export const Themes = new Mongo.Collection('themes');
