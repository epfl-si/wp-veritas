import { withTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { Sites } from '../../../../both/collections';
import { Formik, Field, ErrorMessage } from 'formik';
import { CustomError, CustomInput } from '../CustomFields';
import * as yup from 'yup'; 

class Search extends React.Component {

    urlSchema = yup.object().shape({
        url: yup.
            string('Champ doit être un string').
            url('URL non valide').
            min(19, 'URL la plus courte est https://www.epfl.ch').
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
        }
    }

    submit = (values, actions) => {
        //console.log(values);
        //console.log(this.props.sites);
        
        let res = "";
        this.props.sites.forEach(site => {

            if (values.url.startsWith(site.url)) {

                if (site.url.length > res.length) {
                    res = site.url;
                }
            }
        });
        this.setState({result: res + '/wp-admin'});
        actions.setSubmitting(false);
        actions.resetForm();
    }

    render() {
        let content = (
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
                <h4 className="py-4">L'instance WordPress est : <a href={ this.state.result } target="_blank">{ this.state.result }</a></h4>
            </div>
        )
        return content;
    }
}

export default withTracker(() => {
    Meteor.subscribe('sites.list');
    return {
      sites: Sites.find({}, {sort: {url: 1}}).fetch(),
    };
})(Search);