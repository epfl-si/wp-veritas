import { Sites, Tags, OpenshiftEnvs, Themes, Types } from '../both';

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
  const path = 'openshiftenvs.csv';
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
          url: tag.url,
          name_fr: tag.name_fr,
          name_en: tag.name_en,
          type: tag.type
        }
        if (tagDocument.url=== '' || !Tags.findOne({url: tagDocument.url}) && 
          !Tags.findOne({name_fr: tagDocument.name_fr}) && 
          !Tags.findOne({name_en: tagDocument.name_en})) {
          Tags.insert(tagDocument);
        }
      });
      console.log("Importation tags finished");
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
          let siteDocument = {
            url: site.wp_site_url,
            tagline: site.wp_tagline,
            title: site.wp_site_title,
            openshiftEnv: site.openshift_env,
            type: 'public',
            category: null,
            theme: site.theme,
            faculty: site.theme_faculty,
            languages: langs,
            unitId: site.unit_id,
            snowNumber: '',
            status: 'created',
            comment: '',
            plannedCimportVeritaslosingDate: null,
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
  
  export { importVeritas, importTags, importOpenshiftenvs, importThemes, importTypes }