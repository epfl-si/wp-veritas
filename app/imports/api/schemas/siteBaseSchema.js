import SimpleSchema from 'simpl-schema';
import { isRequired } from './utils';

export const sitesBaseSchema = new SimpleSchema({
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
  type: {
      type: String,
      optional: false,
      allowedValues: ['kubernetes', 'external', 'archived', 'deleted', 'temporary'],
      defaultValue: 'kubernetes',
      label: 'Type de site',
  },
  comment: {
      type: String,
      label: "Commentaire",
      optional: true,
      max: 2048,
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
  isDeleted: {
    type: Boolean,
    defaultValue: false,
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
