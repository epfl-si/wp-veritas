import { Sites, Tags, OpenshiftEnvs, Themes, Types, Categories, Professors, AppLogs } from '../imports/api/collections';

removeAllCollections = () => {
  console.log("La suppression des collections a commencée !");
  
  Sites.remove({});
  Tags.remove({});
  OpenshiftEnvs.remove({});
  Themes.remove({});
  Types.remove({});
  Categories.remove({});
  Professors.remove({});
  AppLogs.remove({});
  // Delete all except me :-)
  Meteor.users.remove({"username":{$nin:["charmier"]}});

  console.log("La suppression des collections est terminée !");
}

export { removeAllCollections }