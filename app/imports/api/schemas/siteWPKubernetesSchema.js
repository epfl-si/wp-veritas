import SimpleSchema from 'simpl-schema';
import { siteWP } from './siteWPSchema';

export const siteWPKubernetesSchema = new SimpleSchema({
  ...siteWP,
  k8sName: {
    type: String,
    optional: false,
    max: 50,
  },
}, { check });
