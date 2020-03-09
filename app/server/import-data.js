import { Themes, Sites } from '../imports/api/collections';
/*
updateThemes = () => {
  console.log("1. Update themes starting ...");
  let themes = Themes.find({}).fetch();

  themes.forEach(theme => {
    console.log(`Theme before update: ${theme.name}`);
    let themeName;
    if (theme.name == "epfl") {
      themeName = "wp-theme-2018";
    } else if (theme.name == "epfl-light") {
      themeName = "wp-theme-light";
    }
    if (themeName !== undefined) {
      Themes.update(
        { _id: theme._id }, 
        { $set: { 'name' : themeName } },
      );
    }
    let newTheme = Themes.findOne(theme._id);
    console.log(`Theme after update: ${newTheme.name}`);
  })
  console.log(`1. All themes updated`);
}

updateThemeInSites = () => {
  console.log("2. Update theme of each site starting ...");
  let sites = Sites.find({}).fetch();
  
  sites.forEach(site => {
    console.log(`Theme of site before update: ${site.theme}`);

    // Mettre à jour le theme 2018 => epfl
    if (site.theme == "epfl") {
      site.theme = "wp-theme-2018";
    } else if (site.theme == "epfl-light") {
      site.theme = "wp-theme-light";
    }

    Sites.update(
      { _id: site._id }, 
      { $set: { 'theme' : site.theme } },
    );

    let newSite = Sites.findOne(site._id);
    console.log(`Theme of site after update: ${ newSite.theme }`);
  });

  console.log(`Nb sites avec theme == epfl: ${ Sites.find({theme : "epfl" }).count() }`);
  console.log(`Nb sites avec theme == epfl-light: ${ Sites.find({theme : "epfl-light" }).count() }`);
  console.log("2. All sites (themes) updated");
}

addUnitNameInSites = () => {

  console.log("3. Update unitName of each site starting ...");
  let sites = Sites.find({}).fetch();
  sites.forEach(site => {
    if ('unitName' in site) {
      console.log("Le site a déjà un unitName: ", site.unitName);
    } else {
      let unit = Meteor.apply('getUnitFromLDAP', [site.unitId], true);
      console.log("unit:", unit);
      if ('cn' in unit ) {
        Sites.update(
          { _id: site._id }, 
          { $set: { 'unitName' : unit.cn } },
        );
      }
    }
    let newSite = Sites.findOne(site._id);
    console.log(`Site: ${newSite.url} => UnitName after update: ${newSite.unitName}`);
  });
  console.log("3. All sites (unitName) updated");
}

addUnitNameN2InSites = () => {
  console.log("4. Update unitNameLevel2 of each site starting ...");
  let sites = Sites.find({}).fetch();
  sites.forEach(site => {
    if ('unitNameLevel2' in site) {
      console.log("Le site a déjà un unitNameLevel2");
    } else {
      let unit = Meteor.apply('getUnitFromLDAP', [site.unitId], true);
      console.log("unit:", unit);
      if ('dn' in unit) {
        let dn = unit.dn.split(",");
        if (dn.length == 5) {
          // example 'ou=associations'
          let unitName = dn[2].split("=")[1];
          Sites.update(
            { _id: site._id }, 
            { $set: { 'unitNameLevel2' : unitName } },
          ); 
        }
      }
    }
    let newSite = Sites.findOne(site._id);
    console.log(`Site: ${newSite.url} => UnitNameLevel2 after update: ${newSite.unitNameLevel2}`);
  });
  console.log("4. All sites (unitNameLevel2) updated");
}
*/
addWPInfra = () => {
  console.log("Add a new field 'wpInfra' of each site starting ...");
  let sites = Sites.find({}).fetch();
  sites.forEach(site => {
    if ('wpInfra' in site) {
      console.log("Le site a déjà un wpInfra");
    } else {
        console.log(site.status);
        let wpInfra = true;
        if (site.status === 'no-wordpress') {
            wpInfra = false;
        } else {
            wpInfra = true;
        }
        Sites.update(
            { _id: site._id },
            { $set: { 'wpInfra' : wpInfra } },
        );
    }
    let newSite = Sites.findOne(site._id);
    console.log(`Site: ${newSite.url} => wpInfra after update: ${newSite.wpInfra}`);
  });
  console.log("All sites (wpInfra) updated");
}

importData = () => {
    addWPInfra();
}

export { importData }