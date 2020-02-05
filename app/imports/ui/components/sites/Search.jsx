import { withTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { Sites } from '../../../api/collections'
import { Formik, Field, ErrorMessage } from 'formik';
import { CustomError, CustomInput } from '../CustomFields';
import * as yup from 'yup';
import ReactHtmlParser from 'react-html-parser';
import { Loading } from '../Messages';


class Search extends React.Component {

  urlSchema = yup.object().shape({
    url: yup.
      string('Champ doit être un string').
      url('URL non valide').
      min(17, 'URL la plus courte est du genre https://x.epfl.ch').
      test('startsWithHttps', 'URL doit commencer par https://', 
        function(value) {
          if (value && !value.startsWith('https://')) {
            return false;
          }
          return true;
        }
      ).
      required('Champ obligatoire')
    });

    constructor(props) {
      super(props);

      this.state = {
        result: '',
        siteFound: false,
      }
    }

    submit = (values, actions) => {
      let res = "";
      let unitName = "";
      let site;
      this.props.sites.forEach(currentSite => {
        if (values.url.startsWith(currentSite.url)) {
          if (currentSite.url.length > res.length) {
              
            // Example: 
            // Existing WordPress instance :
            // - https://www.epfl.ch/campus/services/ressources
            // - https://www.epfl.ch/campus/services
            // User URL: https://www.epfl.ch/campus/services/ressources-informatiques/support-informatique/linux
            // Expected result: https://www.epfl.ch/campus/services/wp-admin
            // And not https://www.epfl.ch/campus/services/ressources/wp-admin

            let check = currentSite.url + "/";
            if (values.url.startsWith(check) || values.url == currentSite.url) {
              site = currentSite;
              res = currentSite.url;    
            }                    
          }
        }
      });

      let siteFound = false;
      if (res == "") {
        res = `Le site <a href='${values.url}' target="_blank">${values.url}</a> n'est pas un site de l'infrastructure WordPress géré par la VPSI`;
      } else {
        if (site.status == 'created') {
          siteFound = true;
          res = res + '/wp-admin';
          res = `L'instance WordPress est : <a href='${res}' target="_blank">${res}</a>`
          console.log(site.unitId);

          unitName = Meteor.call('getUnitNameGreg', site.unitId);
          //unitName = "IDEV-FSD";

          res += ` et le nom de l'unité est ${ unitName }`;

        } else {
          res = `Le site <a href='${values.url}' target="_blank">${values.url}</a> n'est pas un site de l'infrastructure WordPress géré par la VPSI`;
        }
      }
      this.setState({ result: res, siteFound: siteFound });

      actions.setSubmitting(false);
      actions.resetForm();
    }

    loading = () => {
      return this.props.sites === undefined;
    }

    render() {  
      let content;

      if (this.loading()) {
        content = <Loading />
      } else {
        content = (
          <div className="">
            <h4 className="py-4">Quelle est l'instance WordPress de cette URL ?</h4>
            <Formik
              onSubmit={ this.submit }
              initialValues={ {url: ''} }
              validationSchema={this.urlSchema}
              validateOnBlur={ false }
              validateOnChange={ false }
            >
            { ({
                handleSubmit,
                isSubmitting,
                values,
              }) => (              
                <form method="GET" onSubmit={ handleSubmit } className="bg-white border p-4">   
                  <Field placeholder="URL du site" label="URL" name="url" type="text" component={ CustomInput } />
                  <ErrorMessage name="url" component={ CustomError } />
                  <div className="my-1 text-right">
                      <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Rechercher</button>
                  </div>
                </form>
            )}
            </Formik>
            <h4 className="py-4">{ ReactHtmlParser(this.state.result) }</h4>
          </div>
        )
      }
      return content;
    }
}

export default withTracker(() => {
  Meteor.subscribe('sites.list');
  return {
    sites: Sites.find({}, {sort: {url: 1}}).fetch(),
  };
})(Search);