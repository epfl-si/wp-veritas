import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { Tracker } from 'meteor/tracker';
import MessageBox from 'message-box';

SimpleSchema.defineValidationErrorTransform(error => {
    const ddpError = new Meteor.Error(error.message);
    ddpError.error = 'validation-error';
    ddpError.details = error.details;
    return ddpError;
});

const messageBox = new MessageBox({
    messages: {
        fr: {
          required: 'Le champ "{{label}}" est obligatoire',
          minString: 'Le champ "{{label}}" doit contenir au moins {{min}} caractères',
          maxString: 'Le champ "{{label}}" ne peut pas avoir plus de {{max}} caractères',
          minNumber: 'Le champ "{{label}}" a pour valeur minimale {{min}}',
          maxNumber: 'Le champ "{{label}}" a pour valeur maximale {{max}}',
          minNumberExclusive: 'Le champ "{{label}}" doit être plus supérieur à {{min}}',
          maxNumberExclusive: 'Le champ "{{label}}" doit être plus inférieur à {{max}}',
          minDate: 'Le champ "{{label}}" doit être le ou après le {{min}}',
          maxDate: 'Le champ "{{label}}" ne peut pas être après le {{max}}',
          badDate: 'Le champ "{{label}}" n\'est pas une date valide',
          minCount: 'Vous devez spécifier au moins {{minCount}}} valeurs',
          maxCount: 'Vous ne pouvez pas spécifier plus de {{maxCount}}} valeurs',
          noDecimal: 'Ce champ doit être un entier',
          notAllowed: 'Ce champ n\'a pas une valeur autorisée',
          expectedType: '{{label}} doit être de type {{dataType}}',
          regEx({ label, regExp }) {
            switch (regExp) {
                case (SimpleSchema.RegEx.Url.toString()):
                return "Cette URL est invalide";
            }
        },
        keyNotInSchema: '{{name}} n\'est pas autorisé par le schéma',
        },
      },
    tracker: Tracker,
  });

messageBox.setLanguage('fr');

function isRequired() {
    if (this.value === '') {
        return "required";
    }
}

function isRequiredUnderCondition() {    
    if (this.obj.type != 'field-of-research' && this.value === '') {
        return "required";
    }
}

export const openshiftEnvsSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Nom de l environnement openshift",
        custom: isRequired,
    }
}, { tracker: Tracker } );

openshiftEnvsSchema.messageBox = messageBox;

export const typesSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Nom du type",
        custom: isRequired,
    }
}, { check });

typesSchema.messageBox = messageBox;

export const categoriesSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Nom de la catégorie",
        custom: isRequired,
    }
}, { check });

categoriesSchema.messageBox = messageBox;

export const themesSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Nom du thème",
        custom: isRequired,
    }
}, { check });

themesSchema.messageBox = messageBox;

export const sitesSchema = new SimpleSchema({
    // _id use to update a site
    _id: {
        type: String,
        optional: true,
    },
    url: {
        type: String,
        label: "URL",
        optional: false,
        max: 100,
        min: 19, // https://www.epfl.ch is the minimum
        custom: isRequired,
        regEx: SimpleSchema.RegEx.Url,
    }, 
    tagline: {
        type: String,
        label: "Tagline",
        optional: true,
        max: 100,
    },
    title: {
        type: String,
        label: "Titre",
        optional: false,
        max: 100,
        min: 2,
        custom: isRequired
    },
    openshiftEnv: {
        type: String,
        label: "Environnement openshift",
        optional: false,
        max: 100,
        min: 3,
    },
    type: {
        type: String,
        label: "Type",
        optional: false,
        max: 100,
        min: 3,
    },
    category: {
        type: String,
        label: "Catégorie",
        optional: false,
        max: 100,
        min: 3,
    }, 
    theme: {
        type: String,
        label: "Thème",
        optional: false,
        max: 100,
        min: 3,
    },
    faculty: {
        type: String,
        label: "Faculté",
        optional: true,
        max: 100,
    },
    languages: {
        type: Array,
        label: "Langues",
        custom: function () {
            if (this.value.length === 0) {
                return "required";
            }
        },
    },
    'languages.$': {
        type: String,
        allowedValues: ['en', 'fr', 'de', 'el', 'es', 'ro', 'it'],
    },
    unitId: {
        type: String,
        label: 'ID de l unité',
        optional: false,
        min: 3,
        max: 100,
    },
    snowNumber: {
        type: String,
        label: "Numéro de ticket SNOW",
        optional: true,
        max: 100,
    },
    status: {
        type: String,
        label: "Statut",
    },
    comment: {
        type: String,
        label: "Commentaire",
        optional: true,
        max: 255,
    },
    plannedClosingDate: {
        type: String,
        label: "Date de fermeture planifiée",
        optional: true,
    },
    requestedDate: {
        type: Date,
        optional: true,
    },
    createdDate: {
        type: Date,
        optional: true,
    },
    archivedDate: {
        type: Date,
        optional: true,
    },
    trashedDate: {
        type: Date,
        optional: true,
    },
    tags: {
        type: Array,
        label: "Tags",
    },
    'tags.$': {
        type: Object,
        optional: true
    },
    'tags.$._id': {
        type: String,
        optional: true
    },
    'tags.$.url_fr': {
        type: String,
        optional: true
    },
    'tags.$.url_en': {
        type: String,
        optional: true
    },
    'tags.$.name_fr': {
        type: String,
        optional: true
    },
    'tags.$.name_en': {
        type: String,
        optional: true
    },
    'tags.$.type': {
        type: String,
        optional: true
    },
}, { check });

export const tagSchema = new SimpleSchema({
    // _id use to update a tag
    _id: {
        type: String,
        optional: true,
    },
    name_fr: {
        type: String,
        label: "Nom du tag fr",
        custom: isRequired,
    },
    name_en: {
        type: String,
        label: "Nom du tag en",
        custom: isRequired,
    },
    url_fr: {
        type: String,
        label: "URL du tag en français",
        custom: isRequiredUnderCondition,
    },
    url_en: {
        type: String,
        label: "URL du tag en anglais",
        custom: isRequiredUnderCondition,
    },
    type: {
        type: String,
        label: "Type de tag",
        allowedValues: ['faculty', 'institute', 'field-of-research'],
    }
}, { tracker: Tracker } )

sitesSchema.messageBox = messageBox;
tagSchema.messageBox = messageBox;

class Site {
    constructor(doc) {
        _.extend(this, doc);
    }

    // TODO: Use https://github.com/vazco/meteor-universe-i18n
    getStatus() {
        switch(this.status) {
            case 'requested':
              return 'Demandé';
            case 'created':
                return 'Créé';
            case 'archived':
                return 'Archivé';
            case 'trashed':
                return 'Supprimé';  
            default:
              return this.status;
          }
    }
}

export const Sites = new Mongo.Collection('sites', {
    transform: (doc) => new Site(doc)
});

/**
 * Search for a specific text, or a list of tags, for element with at least a tag. Sort by title
 * @param {string=} text to search, approximatively (regex wide search, insensitive)
 * @param {array=} lookup for this tag entries, precisely (regex specific search, insensitive)
 * @param {number=} limit the number of result returned
 */
Sites.tagged_search = function (text="", tags=[], limit=500) {
    // build the query
    let finder = {
        '$and': []
    };

    finder['$and'].push({
        "tags": { $exists: true, $ne: [] }
    });

    if (tags !== undefined && tags.length != 0) {
        let regex_search = [];
        tags.forEach(function(tag){
            regex_search.push(  new RegExp("^" + tag + "$", "i") );
        });

        finder['$and'].push({
            $or: [
                {
                    "tags.name_en": { $all: regex_search}
                },
                {
                    "tags.name_fr": { $all: regex_search}
                }
            ]
        });
    }

    if (text !== undefined && text != "") {
        // start a regex search, so we have a better and
        // precise results at the end
        regex_text = text;
        regex_options = "i";

        finder['$and'].push({
            $or: [
                {
                    "tags.name_en": { $regex: regex_text, $options: regex_options}
                },
                {
                    "tags.name_fr": { $regex: regex_text, $options: regex_options}
                },
                {
                    "url": { $regex: regex_text, $options: regex_options}
                },
                {
                    "title": { $regex: regex_text, $options: regex_options}
                },
                {
                    "tagline": { $regex: regex_text, $options: regex_options}
                }
            ]
        });
    }

    return Sites.find(finder,
        {
            sort: {
                title: 1
            },
            limit: limit
        }
    ).fetch();
}

export const OpenshiftEnvs = new Mongo.Collection('openshiftenvs');
export const Types = new Mongo.Collection('types');
export const Categories = new Mongo.Collection('categories');
export const Themes = new Mongo.Collection('themes');
export const Tags = new Mongo.Collection('tags');
