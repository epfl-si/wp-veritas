import { Sites, Tags } from '../both';

importTags = () => {
  const path = 'source-tags.csv';
  const file = Assets.getText(path);
  Papa.parse(file, {
    delimiter: ",",
    header: true,
    complete: function(results) {
      
      let data = JSON.parse(JSON.stringify(results.data));
      
      let index = 0;
      data.forEach(tag => {
        index = index + 1;
        console.log(index);

        let tagDocument = {
          url: tag.url,
          name_fr: tag.name_fr,
          name_en: tag.name_en,
          type: tag.type
        }

        if (!Tags.findOne({url: tagDocument.url}) && 
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
        
        let index = 0;
        data.forEach(site => {
          index = index + 1;
          console.log(index);
  
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
  
  export { importVeritas, importTags}