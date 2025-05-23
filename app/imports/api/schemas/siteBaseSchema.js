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
  monitorSite: {
      type: Boolean,
      optional: true,
  },
}

export const siteBaseSchema = new SimpleSchema(siteBase, { check })
