import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { Tracker } from 'meteor/tracker';
import MessageBox from 'message-box';
import { isRequired, isRequiredUnderCondition } from './schemas/utils';
import { siteExternalSchema } from './schemas/siteExternal';
import { siteWPSchema } from './schemas/siteWPSchema';

SimpleSchema.defineValidationErrorTransform(error => {
    const ddpError = new Meteor.Error(error.message);
    ddpError.error = 'validation-error';
    ddpError.details = error.details;
    return ddpError;
});

const messageBox = new MessageBox({
    messages: {
        fr: {
          required: (context) => `Le champ "${context.label}" est obligatoire`,
          minString: (context) => `Le champ "${context.label}" doit contenir au moins ${context.min} caractères`,
          maxString: (context) => `Le champ "${context.label}" ne peut pas avoir plus de ${context.max} caractères`,
          minNumber: (context) => `Le champ "${context.label}" a pour valeur minimale ${context.min}`,
          maxNumber: (context) => `Le champ "${context.label}" a pour valeur maximale ${context.max}`,
          minNumberExclusive: (context) => `Le champ "${context.label}" doit être plus supérieur à ${context.min}`,
          maxNumberExclusive: (context) => `Le champ "${context.label}" doit être plus inférieur à ${context.max}`,
          minDate: (context) => `Le champ "${context.label}" doit être le ou après le ${context.min}`,
          maxDate: (context) => `Le champ "${context.label}" ne peut pas être après le ${context.max}`,
          badDate: (context) => `Le champ "${context.label}" n\'est pas une date valide`,
          minCount: (context) => `Vous devez spécifier au moins ${context.minCount} valeurs`,
          maxCount: (context) => `Vous ne pouvez pas spécifier plus de ${context.maxCount} valeurs`,
          noDecimal: () => `Ce champ doit être un entier`,
          notAllowed: () => `Ce champ n\'a pas une valeur autorisée`,
          expectedType: (context) => `${context.label} doit être de type ${context.dataType}`,
          regEx({ label, regExp }) {
            switch (regExp) {
                case (SimpleSchema.RegEx.Url.toString()):
                return "Cette URL est invalide";
            }
        },
        keyNotInSchema: (context) => `${context.name} n\'est pas autorisé par le schéma`,
        },
      },
    tracker: Tracker,
  });

messageBox.setLanguage('fr');

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
        allowedValues: ['faculty', 'institute', 'field-of-research', "doctoral-program"],
    },
    sites: {
        type: Array,
        label: "Sites",
        optional: true,
    },
    'sites.$': {
        type: String,
        optional: true,
    },
}, { tracker: Tracker } )

export const typesSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Nom du type",
        custom: isRequired,
    },
    description: {
        type: String,
        label: "Description du type",
        optional: true,
    },
    schema: {
        type: Object,
        label: "Schéma du type",
        optional: false,
        defaultValue: "test",
    }
}, { check });

siteWPSchema.messageBox = messageBox;
siteExternalSchema.messageBox = messageBox;
tagSchema.messageBox = messageBox;
typesSchema.messageBox = messageBox;

export class Site {
  constructor(doc) {
    Object.assign(this, doc);
  }

  getCreatedDate() {
    return new Date(this.k8screatedDate || this.createdDate);
  }

  isThemeAllowed (theme) {
    const url = URL.parse(this.url);
    if ((url.host === "www.epfl.ch") ||
        (url.host === "inside.epfl.ch") ||
        (url.host === "formation-wp.epfl.ch")) {
      return theme === "wp-theme-2018";
    } else if (url.host === "wpn-test.epfl.ch") {
      return true;
    } else {
      return theme === "wp-theme-light";
    }
  }
}

export const Sites = new Mongo.Collection(
  "sites",
  {
    transform: (doc) => new Site(doc),
  });

/**
 * Search for a specific text, or a list of tags, for element with at least a tag. Sort by title
 * @param {string=} text to search, approximatively (regex wide search, insensitive)
 * @param {array=} lookup for this tag entries, precisely (regex specific search, insensitive)
 */

Sites.taggedSearchAsync = async function (text="", tags=[]) {
    // build the query
    let finder = {
       isDeleted: false,
       $and : []
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

    return await Sites.find(finder,
        {
            sort: {
                title: 1
            }
        }
    ).fetchAsync();
}

const Categories = new Mongo.Collection('categories');
const Themes = new Mongo.Collection('themes');
const Tags = new Mongo.Collection('tags');
const Types = new Mongo.Collection('types');
const AppLogs = new Mongo.Collection('AppLogs');

if (Meteor.isServer) {
  Sites.ensureExists = async function(url) {
    const site = await Sites.findOneAsync({ url });
    if (site) return site;
    await Sites.insertAsync({ url });
    return await Sites.findOneAsync({ url });
  }
}

Meteor.users.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

export {
  Categories,
  Themes,
  Tags,
  Types,
  AppLogs,
}
