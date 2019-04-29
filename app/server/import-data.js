import { Sites, Tags, OpenshiftEnvs, Themes, Types, Categories } from '../both';
import URL from 'url-parse';

importData = () => {

  if (Sites.find({ type: 'unmanaged' }).count() == 0) {
    console.log("Import unmanaged sites");
    importUnmanagedSites();
  } else {
    console.log("Sites unmanaged already exist");
  }

  /*

  if (Sites.find({}).count() == 0) {
    console.log("Import sites");
    importVeritas();
  } else {
    console.log("Sites already exist");
  }

  if (Tags.find({}).count() == 0) {
    console.log("Import tags");
    importTags();
  } else {
    console.log("Tags already exist");
  }
  */
  if (OpenshiftEnvs.find({}).count() == 5) {
    console.log("Import openshiftenvs");
    importOpenshiftenvs();
  } else {
    console.log("openshiftenvs already exist");
  }
  /*
  if (Themes.find({}).count() == 0) {
    console.log("Import themes");
    importThemes();
  } else {
    console.log("Themes already exist");
  }

  if (Types.find({}).count() == 0) {
    console.log("Import types");
    importTypes();
  } else {
    console.log("Types already exist");
  }

  if (Categories.find({}).count() == 0) {
    console.log("Import categories");
    importCategories();
  } else {
    console.log("Categories already exist");
  }

  importTagsBySite();
  */
}

importTagsBySite = () => {
  const path = 'site-tags.csv';
  const file = Assets.getText(path);
  let ok = 0;
  let ko = 0;
  let nb_tags = 0;

  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      data.forEach(line => {
        
        // Checker si l'URL du site existe
        let url_object = new URL(line.site_url);
    
        let url = 'https://' + url_object.hostname + url_object.pathname;
        url = url.replace(/\/$/, "");
        
        let key = url_object.hostname.replace(".epfl.ch", "");
        let url_2018 = "https://www.epfl.ch/labs/" + key;
        let exist_2010 = false;
        let exist_2018 = false;

        let site;

        if (Sites.find({url: url}).count() == 1){  
          exist_2010 = true;
          ok = ok + 1;
          site = Sites.findOne({url: url});
          console.log(`URL ${ url } existe`);
        } else if (Sites.find({url: url_2018}).count() == 1) {
          exist_2018 = true;
          ok = ok + 1;
          site = Sites.findOne({url: url_2018});
          console.log(`URL ${ url_2018 } existe`);
        } else {
          ko = ko + 1;
        }

        if (!exist_2010 && !exist_2018) {
          
          console.log(`URLs ${ url } ou ${ url_2018 } n'existent pas `);
        } else {

          // est ce que le tag fac existe ?
          if (Tags.find({name_fr: line.fac}).count() == 1) {

            let tag = Tags.findOne({name_fr: line.fac});
            console.log(`Tag fac ${tag.name_fr} existe`);

            // est ce que ce site a déjà ce tag fac ?
            let tag_exist = false;
            site.tags.forEach(function(tag) {
              if (tag.name_fr == line.fac) {
                tag_exist = true;
              }
            });
            
            if (!tag_exist) {

              console.log(`Site ${site.url} n'a pas deja le Tag fac ${tag.name_fr}`);

              // ajouter le tag
              site.tags.push(tag);
              
              Sites.update(
                {"_id": site._id},
                {
                    $set: {
                        'tags': site.tags,
                    }
                }
              );

              nb_tags += 1;

              console.log(`Ajout du tag ${tag.name_fr} au site ${site.url}`);
            } else {
              console.log(`Site a deja le Tag fac`)
            }
          }

          // est ce que le tag institut existe ?
          if (Tags.find({name_fr: line.institut}).count() == 1) {

            let tag = Tags.findOne({name_fr: line.institut});
            console.log(`Tag institut ${tag.name_fr} existe`);
            
            // est ce que ce site a déjà ce tag institut ?
            let tag_exist = false;
            site.tags.forEach(function(tag) {
              if (tag.name_fr == line.institut) {
                tag_exist = true;
              }
            });

            if (!tag_exist) {
              console.log(`Site ${site.url} n'a pas deja le Tag institut ${tag.name_fr}`);

              // ajouter le tag
              site.tags.push(tag);
              
              Sites.update(
                {"_id": site._id},
                {
                    $set: {
                        'tags': site.tags,
                    }
                }
              );
              nb_tags += 1;
              console.log(`Ajout du tag ${tag.name_fr} au site ${site.url}`);
            } else {
              console.log(`Site a deja le Tag institut`);
            }
            
          } 
        }

        console.log(`Nb tags ${nb_tags}`);

      });
      console.log(`Importation TagsBySite finished: ok: ${ok} ko:${ko} nb tags: ${nb_tags}`);
    }    
  });
}

importCategories = () => {
  const path = 'categories.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      data.forEach(category => {
        let categoryDocument = {
          name: category.name,
        }
        if (!Categories.findOne({name: categoryDocument.name})) {
          Categories.insert(categoryDocument);
        }
      });
      console.log("Importation categories finished");
    }    
  });
}

importTypes = () => {
  const path = 'types.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      data.forEach(type => {
        let typeDocument = {
          name: type.name,
        }
        if (!Types.findOne({name: typeDocument.name})) {
          Types.insert(typeDocument);
        }
      });
      console.log("Importation types finished");
    }    
  });
}

importThemes = () => {
  const path = 'themes.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      data.forEach(theme => {
        let themeDocument = {
          name: theme.name,
        }
        if (!Themes.findOne({name: themeDocument.name})) {
          Themes.insert(themeDocument);
        }
      });
      console.log("Importation themes finished");
    }    
  });
}

importOpenshiftenvs = () => {
  // const path = 'openshiftenvs.csv';
  const path = 'openshiftenvs_update.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      data.forEach(openshiftenv => {
        let openshiftenvsDocument = {
          name: openshiftenv.name,
        }
        if (!OpenshiftEnvs.findOne({name: openshiftenvsDocument.name})) {
            OpenshiftEnvs.insert(openshiftenvsDocument);
        }
      });
      console.log("Importation Openshiftenvs finished");
    }    
  });
}

importTags = () => {
  const path = 'tags.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      data.forEach(tag => {
        let tagDocument = {
          url_fr: tag.url_fr,
          url_en: tag.url_en,
          name_fr: tag.name_fr,
          name_en: tag.name_en,
          type: tag.type
        }
        
        let url_fr_exist = Tags.findOne({url: tagDocument.url_fr});
        let url_en_exist = Tags.findOne({url: tagDocument.url_en});
        let name_fr_exist = Tags.findOne({name_fr: tagDocument.name_fr});
        let name_en_exist = Tags.findOne({name_en: tagDocument.name_en});

        if (!name_fr_exist && !name_en_exist) {
          if ((tagDocument.url_fr === '' || !url_fr_exist) && 
          (tagDocument.url_en === '' || !url_en_exist)) {
            Tags.insert(tagDocument);
          }
        }
      });
      console.log("Importation tags finished");
    }    
  });
}

importUnmanagedSites = () => {
  const path = 'unmanaged.csv';
  const file = Assets.getText(path);
  

  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      let number = 0;
      data.forEach(site => {
        let langs;
        if (site.langs == 'fr' || site.langs == 'en') {
          langs = [site.langs];
        } else {
          langs = site.langs.split(',')
        }

        let url = site.wp_site_url;
        url = url.replace(/\/$/, "");
        let siteDocument = {
          url: url,
          tagline: site.wp_tagline,
          title: site.wp_site_title,
          openshiftEnv: site.openshift_env,
          type: 'public',
          category: site.category,
          theme: site.theme,
          faculty: site.theme_faculty,
          languages: langs,
          unitId: site.unit_id,
          snowNumber: '',
          status: 'created',
          comment: site.comment,
          plannedClosingDate: null,
          requestedDate: null,
          createdDate: null,
          archivedDate: null,
          trashedDate: null,
          tags: [],
        }
        if (!Sites.findOne({url: siteDocument.url})) {
          Sites.insert(siteDocument);
          number = number + 1;
          console.log(`n°${number} Site ${url}`);
        }
      });
      console.log("Importation unmanaged sites finished");
    }    
  });
}

importVeritas = () => {
    const path = 'source-veritas.csv';
    const file = Assets.getText(path);
    Papa.parse(file, {
      delimiter: ",",
      header: true,
      complete: function(results) {
        let data = JSON.parse(JSON.stringify(results.data));
        data.forEach(site => {
          let langs;
          if (site.langs == 'fr' || site.langs == 'en') {
            langs = [site.langs];
          } else {
            langs = site.langs.split(',')
          }

          let url = site.wp_site_url;
          url = url.replace(/\/$/, "");
          let siteDocument = {
            url: url,
            tagline: site.wp_tagline,
            title: site.wp_site_title,
            openshiftEnv: site.openshift_env,
            type: 'unmanaged',
            category: site.category,
            theme: site.theme,
            faculty: site.theme_faculty,
            languages: langs,
            unitId: site.unit_id,
            snowNumber: '',
            status: 'created',
            comment: site.comment,
            plannedClosingDate: null,
            requestedDate: null,
            createdDate: null,
            archivedDate: null,
            trashedDate: null,
            tags: [],
          }
          if (!Sites.findOne({url: siteDocument.url})) {
            Sites.insert(siteDocument);
          }
        });
        console.log("Importation veritas finished");
      }    
    });
  }
  
  export { importData }