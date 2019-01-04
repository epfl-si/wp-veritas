import React from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import apiWPSite from '../../conf/api.wp_site';


const CustomInput = ({ field, form, ...props }) => {
    return (
      <div className="form-group">
        <label>{ props.label }</label>
        <input { ...field } { ...props } className="form-control" />
      </div>
    )
  }
  
  const CustomSelect = ({ field, form, ...props }) => {
    return (
      <div className="form-group">
        <label>{ props.label }</label>
        <select className="form-control" { ...props } { ...field } />
      </div>
    )
  }
  
  const CustomError = (props) => {
    return (
      <div className="text-danger">{ props.children }</div> 
    )
  }

  export default class Add extends React.Component {

    userSchema = Yup.object().shape({
        url: Yup.string().url('Bad URL').required('Required'),
        openshift_env: Yup.string().oneOf(['www', 'sandbox', 'subdomains'], 'Bad openshift environment').required('Required') 
      })
    
      submit = (values, actions) => {
        apiWPSite.post('/sites', values)
          .then( response => {
            actions.setSubmitting(false);
            console.log(response);
          })
      }

    render() {
        return (
            
            <div className="container-fluid p-5 bg-light 
            d-flex flex-column justify-content-center align-items-center">
            
                <Formik
                onSubmit={ this.submit }
                initialValues={ { url: '', openshift_env: '' } }
                validationSchema={ this.userSchema }
        
                validateOnBlur={ true }
                validateOnChange={ false }
                >
                { ({
                    handleSubmit,
                    isSubmitting,
                }) => (
                  
                    <form onSubmit={ handleSubmit } className="bg-white border p-5 d-flex flex-column">
                    <h2 className="p-4">Ajouter un nouveau site</h2>  
                    <Field label="URL" name="url" type="url" component={ CustomInput } />
                    <ErrorMessage name="url" component={ CustomError } />

                    <Field label="Openshift Environnement" name="openshift_env" component={ CustomSelect }>
                        <option value="www">www</option>
                        <option value="sandbox">sandbox</option>
                        <option value="subdomains">subdomains</option>
                    </Field>
                    <ErrorMessage name="openshift_env" component={ CustomError } />
                    
                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Envoyer</button>
                    </form>
                )}
                </Formik>
            </div>
        )
      }
    }