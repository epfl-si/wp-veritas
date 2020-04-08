import SimpleSchema from 'simpl-schema';
import { isRequired } from './utils';

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
      min: 17, // https://x.epfl.ch is the minimum
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
      min: 1,
      max: 100,
  },
  unitName: {
    type: String,
    label: 'Nom de l unité',
    optional: true,
  },
  unitNameLevel2: {
    type: String,
    label: 'Nom de l unité de niveau 2',
    optional: true,
  },
  snowNumber: {
      type: String,
      label: "Numéro de ticket SNOW",
      optional: true,
      max: 100,
  },
  wpInfra: {
      type: Boolean,
      optional: false,
  },
  comment: {
      type: String,
      label: "Commentaire",
      optional: true,
      max: 255,
  },
  createdDate: {
      type: Date,
      optional: true,
  },
  userExperience: {
      type: Boolean,
      optional: true,
  },
  userExperienceUniqueLabel: {
    type: String,
    optional: true,
    max: 50,
  },
  slug: {
    type: String,
    optional: true,
    max: 50,
  },
  professors: {
    type: Array,
    label: "Professors",
  },
  'professors.$': {
    type: Object,
    optional: true
  },
  'professors.$._id': {
    type: String,
    optional: true
  },
  'professors.$.sciper': {
    type: String,
    optional: true
  },
  'professors.$.displayName': {
    type: String,
    optional: true
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