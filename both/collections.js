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
    url: {
        type: String,
        max: 100,
        min: 19, // https://www.epfl.ch is the minimum
        optional: true
    }, 
    tagline: {
        type: String,
        optional: true,
        max: 100,
    },
    title: {
        type: String,
        optional: true,
        max: 100,
        min: 3,
    },
    _id: {
        type: String,
        optional: true
    },
    openshiftEnv: {
        type: String,
        optional: true
    },
    type: {
        type: String,
        optional: true
    },
    category: {
        type: String,
        optional: true
    }, 
    theme: {
        type: String,
        optional: true
    },
    faculty: {
        type: String,
        optional: true
    },

    languages: {
        type: Array,
    },
    'languages.$': String,
    unitId: {
        type: String,
        optional: true
    },
    snowNumber: {
        type: String,
        optional: true
    },
    comment: {
        type: String,
        optional: true
    },
    plannedClosingDate: {
        type: String,
        optional: true
    }
}, { check });

export const Sites = new Mongo.Collection('sites');
export const OpenshiftEnvs = new Mongo.Collection('openshift-envs');
export const Types = new Mongo.Collection('types');
export const Themes = new Mongo.Collection('themes');
