import SimpleSchema from 'simpl-schema';
import { isRequired } from './utils';

export const siteBase = {
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
      type: Number,
      label: "ID de l'unité",
      optional: false,
  },
  unitName: {
    type: String,
    label: "Nom de l'unité",
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
      label: 'Type de site',
  },
  comment: {
      type: String,
      label: "Commentaire",
      optional: true,
      max: 2048,
  },
  createdDate: {
      type: String,
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
}

export const siteBaseSchema = new SimpleSchema(siteBase, { check })
