import SimpleSchema from 'simpl-schema';
import { sitesBaseSchema } from './siteBaseSchema';

export const sitesExternal = new SimpleSchema({
  ...sitesBaseSchema,
}, { check });
