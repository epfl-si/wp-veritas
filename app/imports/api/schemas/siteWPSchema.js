import SimpleSchema from 'simpl-schema';
import { isRequired } from './utils';
import { sitesBaseSchema } from './siteBaseSchema';

export const sitesWPSchema = new SimpleSchema({
  ...sitesBaseSchema,
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
  categories: {
    type: Array,
    label: "Categories",
    optional: false
  },
  'categories.$': {
    type: Object,
    optional: true
  },
  'categories.$._id': {
    type: String,
    optional: true
  },
  'categories.$.name': {
    type: String,
    optional: true
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
}, { check });
