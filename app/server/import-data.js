import { sitesSchema } from '../imports/api/schemas/sitesSchema';
import { Sites } from '../imports/api/collections';

loadTestData = () => {
  
  // delete all data
  const absoluteUrl = Meteor.absoluteUrl();
  if (absoluteUrl === "http://localhost:3000/" || absoluteUrl.startsWith('https://wp-veritas.128.178.222.83.nip.io/')) {
    Sites.remove({});
  }
  
  var myjson = {};
  myjson = JSON.parse(Assets.getText("inventory-test.json"));
  let sites = myjson['_meta']['hostvars'];
  // console.log(sites);

  for (var currentSite in sites) {
    let site = myjson['_meta']['hostvars'][currentSite];

    if (site.wp_hostname !== 'migration-wp.epfl.ch') {
      continue;
    }
    if (site.wp_env !== 'int') {
      continue;
    }
    console.log(site);
    
    let url = `https://${ site.wp_hostname }/${ site.wp_path }`;
    let title = site.wp_path;
    let category = site['wp_details']['options']['epfl:site_category'];
    if (category == null) {
      category = 'GeneralPublic';
    }
    let theme = site['wp_details']['options']['stylesheet'];;
    let languages = site['wp_details']['polylang']['langs'];
    if (!languages) {
      continue;
    }
    let unitId = site['wp_details']['options']['plugin:epfl_accred:unit_id'];
    let unitName = site['wp_details']['options']['plugin:epfl_accred:unit'];

    console.log(url);
    console.log(title);
    console.log(category);
    console.log(theme);
    console.log(languages);
    console.log(unitId);
    console.log(unitName);

    let siteDocument = {
      url: url,
      tagline: '',
      title: title,
      wpInfra: true,
      openshiftEnv: 'int',
      category: category,
      theme: theme,
      languages: languages,
      unitId: unitId,
      unitName: unitName,
      unitNameLevel2: '',
      snowNumber: '',
      comment: '',
      userExperience: false,
      slug: '',
      professors: [],
      tags: [],
    }
    
    sitesSchema.validate(siteDocument);

    let newSiteId = Sites.insert(siteDocument);
    
  }
}

deleteUnusedFields = () => {

  let sites = Sites.find({}).fetch();

  sites.forEach(site => {

    console.log(`Site ${ site.url }`);
    console.log("Site avant :", site);

    Sites.update(
      { _id: site._id },
      { $unset: {
        'type': "",
        'status': "",
        'plannedClosingDate': "",
        'requestedDate': "",
        'archivedDate': "",
        'trashedDate': "",
        'inPreparationDate': "",
        'noWordPressDate': "",
      }},
    );

    let siteAfter = Sites.findOne({_id: site._id});
    console.log("Site après : ", siteAfter);
  });

}

importData = () => {
  /*
  const absoluteUrl = Meteor.absoluteUrl();
  if (absoluteUrl === "http://localhost:3000/" || absoluteUrl.startsWith('https://wp-veritas.128.178.222.83.nip.io/')) {
    loadTestData();
  }
  */

  deleteUnusedFields();
  
}

export { importData }