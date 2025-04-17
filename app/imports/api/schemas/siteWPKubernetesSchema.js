import SimpleSchema from 'simpl-schema';
import { sitesWPSchema } from './siteWPSchema';

export const sitesWPKubernetesSchema = new SimpleSchema({
  ...sitesWPSchema,
  name: {
    type: String,
    optional: false,
    max: 50,
  },
}, { check });
