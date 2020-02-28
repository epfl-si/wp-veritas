import { Themes, Sites } from '../imports/api/collections';

updateThemes = () => {
  console.log("Update themes starting ...");
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
  console.log(`All themes updated`);
}

updateThemeInSites = () => {
  console.log("Update sites starting ...");
  let sites = Sites.find({}).fetch();
  
  sites.forEach(site => {
    console.log(`Site before update: ${site.theme}`);

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
    console.log(`Site after update: ${ newSite.theme }`);
  });

  console.log(`Nb sites avec theme == epfl: ${ Sites.find({theme : "epfl" }).count() }`);
  console.log(`Nb sites avec theme == epfl-light: ${ Sites.find({theme : "epfl-light" }).count() }`);
}

addUnitNameInSites = () => {
  let sites = Sites.find({}).fetch();
  sites.forEach(site => {
    console.log(site);
    if ('unitName' in site) {
      console.log("Le site a déjà un unitName");
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
    console.log('Site after update:', newSite);
  });
}

addUnitNameN2InSites = () => {
  let sites = Sites.find({}).fetch();
  sites.forEach(site => {
    console.log(site);
    if ('unitNameLevel2' in site) {
      console.log("Le site a déjà un unitNameLevel2");
    } else {
      let unit = Meteor.apply('getUnitFromLDAP', [site.unitId], true);
      console.log("unit:", unit);
      if ('dn' in unit) {
        let dn = unit.dn.split(",");
        if (dn.length == 5) {
          Sites.update(
            { _id: site._id }, 
            { $set: { 'unitNameLevel2' : dn[2] } },
          ); 
        }
      }
    }
    let newSite = Sites.findOne(site._id);
    console.log('Site after update:', newSite);
  });
}

importData = () => {
  // updateThemes();
  // updateThemeInSites();
  // addUnitNameInSites();
  addUnitNameN2InSites();
}

export { importData }