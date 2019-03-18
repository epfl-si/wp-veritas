import { Sites } from '../both';

export default importVeritas = () => {
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
  