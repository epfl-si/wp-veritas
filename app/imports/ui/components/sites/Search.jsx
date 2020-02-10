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
        unitName: '',
        site: {},
        urlSearched: '',
      }
    }

    getUnitName = (unitId) => {
      Meteor.call('getUnitFromLDAP', unitId, (error, unitLDAPinformations) => {
        if (error) {
          console.log(`ERROR ${error}`);
        } else {
          let unitName = unitLDAPinformations.cn + " (" + unitId + ")";
          this.setState( 
            { unitName: unitName } 
          );
        }
      });
    }

    submit = (values, actions) => {

      let res = "";
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
              res = currentSite.url; 
              this.getUnitName(currentSite.unitId);
              this.setState({ site: currentSite , urlSearched: values.url });
            }                    
          }
        }
      });
      if (res == "") {
        this.setState({ site: {} , urlSearched: values.url });
      }
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

        let res = "";
        if (this.state.site == {}) {
          res = `Le site <a href='${ this.state.urlSearched }' target="_blank">${ this.state.urlSearched }</a> n'est pas un site de l'infrastructure WordPress géré par la VPSI`;
        } else {
          if (this.state.site.status == 'created') {
            
            res = this.state.site.url + '/wp-admin';
            res = `L'instance WordPress est : <a href='${ res }' target="_blank">${ res }</a>`;
            res += ` <br />Unité de rattachement <strong>${ this.state.unitName }</strong>`;
  
          } else {
            res = `Le site <a href='${ this.state.urlSearched }' target="_blank">${ this.state.urlSearched }</a> n'est pas un site de l'infrastructure WordPress géré par la VPSI`;
          }
        }

        let displayResult;
        if (this.state.urlSearched !== '') {
          displayResult = ( <h4 className="py-4">{ ReactHtmlParser(res) }</h4> )
        }

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

            { displayResult }
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