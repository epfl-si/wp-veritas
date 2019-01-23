import { Mongo } from 'meteor/mongo';

export const Sites = new Mongo.Collection('sites');
export const OpenshiftEnvs = new Mongo.Collection('openshift-envs');
export const Types = new Mongo.Collection('types');
export const Themes = new Mongo.Collection('themes');
