import SimpleSchema from 'simpl-schema';
import { siteBase } from './siteBaseSchema';

export const siteExternalSchema = new SimpleSchema({
  ...siteBase
}, { check });
