import SimpleSchema from 'simpl-schema';
import { siteBase } from './siteBaseSchema';

export const siteExternal = new SimpleSchema({
  ...siteBase
}, { check });
