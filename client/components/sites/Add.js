import React from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Sites } from '../../../imports/api/sites';

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
    <div className="text-danger mb-4">{ props.children }</div> 
  )
}

export default class Add extends React.Component {

  siteSchema = Yup.object().shape({
      url: Yup.string().url('Bad URL').required('Champ obligatoire'),
      tagline: Yup.string().required('Champ obligatoire'),
      title: Yup.string().required('Champ obligatoire'),
      openshift_env: Yup.string().oneOf(['www', 'sandbox', 'subdomains'], 'Bad openshift environment').required('Champ obligatoire'),
      type: Yup.string().oneOf(['private', 'public', 'unmanaged']).required('Champ obligatoire'),
      theme: Yup.string().oneOf(['2018', '2018-light']).required('Champ obligatoire'),
      faculty: Yup.string().oneOf(['CDH', 'CDM', 'ENAC', 'IC', 'SB', 'STI', 'SV']).required('Champ obligatoire'),
      language: Yup.string().oneOf(['fr', 'en']).required('Champ obligatoire'),
      unit_id: Yup.string().required('Champ obligatoire'),
      snow_number: Yup.string()

  })

  constructor(props){
    super(props);
    
    let action;
    if (this.props.match.path.startsWith('/edit')) {
      action = 'edit';
    } else {
      action = 'add';
    }

    this.state = {
        site: '',
        action: action
    }
  }

  componentDidMount() {
    if (this.state.action === 'edit') {        
      Tracker.autorun(()=>{
        let site = Sites.findOne({_id: this.props.match.params._id});
        this.setState({site: site});
      });
    }
  }
    
  submit = (values, actions) => {
    if (this.state.action === 'add') {
      Sites.insert(values); 
      this.props.history.push('/list');
    }
    if (this.state.action === 'edit') {
      Sites.update({_id:this.props.match.params._id}, { $set:values});
      this.props.history.push('/list');
    }
  }

  render() {

    if ((this.state.site === undefined || this.state.site === '')  && this.state.action === 'edit') {
      
      return <h1>Loading....</h1>

    } else {
      
      let initialValues;
      let title;
      
      if (this.state.action === 'edit') {
      
        title = 'Modifier le site ci-dessous'
        initialValues = this.state.site;
      
      } else { 
      
        title = 'Ajouter un nouveau site';
        initialValues = { 
          url: '', tagline:'', title:'', openshift_env: 'www', type: 'private', theme:'2018', faculty:'CDH', language:'en', unit_id:'', snow_number:'' 
        }
      
      }

      return (
          
        <div className="container-fluid p-5 bg-light 
        d-flex flex-column justify-content-center align-items-center">
        
            <Formik
            onSubmit={ this.submit }
            initialValues={ initialValues }
            validationSchema={ this.siteSchema }
            validateOnBlur={ false }
            validateOnChange={ false }
            >
            { ({
                handleSubmit,
                isSubmitting,
            }) => (
              
                <form onSubmit={ handleSubmit } className="bg-white border p-5 d-flex flex-column">
                <h2 className="p-4">{title}</h2>  
                <Field label="URL" name="url" type="url" component={ CustomInput } />
                <ErrorMessage name="url" component={ CustomError } />

                <Field label="Tagline" name="tagline" type="text" component={ CustomInput } />
                <ErrorMessage name="tagline" component={ CustomError } />

                <Field label="Titre" name="title" type="text" component={ CustomInput } />
                <ErrorMessage name="title" component={ CustomError } />

                <Field label="Openshift Environnement" name="openshift_env" component={ CustomSelect }>
                    <option value="www">www</option>
                    <option value="sandbox">sandbox</option>
                    <option value="subdomains">subdomains</option>
                </Field>
                <ErrorMessage name="openshift_env" component={ CustomError } />
                
                <Field label="Type" name="type" type="text" component={ CustomSelect } >
                    <option value="private">private</option>
                    <option value="public">public</option>
                    <option value="unmanaged">unmanaged</option>
                </Field>
                <ErrorMessage name="type" component={ CustomError } />

                <Field label="Thème" name="theme" type="text" component={ CustomSelect } >
                    <option value="2018">2018</option>
                    <option value="2018-light">2018-light</option>
                </Field>
                <ErrorMessage name="theme" component={ CustomError } />

                <Field label="Faculté" name="faculty" type="text" component={ CustomSelect } >
                    <option value="CDH">CDH</option>
                    <option value="CDM">CDM</option>
                    <option value="ENAC">ENAC</option>
                    <option value="IC">IC</option>
                    <option value="SB">SB</option>
                    <option value="STI">STI</option>
                    <option value="SV">SV</option>
                </Field>
                <ErrorMessage name="faculty" component={ CustomError } />

                <Field label="Langue" name="language" type="text" component={ CustomSelect } >
                    <option value="fr">français</option>
                    <option value="en">anglais</option>
                </Field>
                <ErrorMessage name="language" component={ CustomError } />

                <Field label="Unit ID" name="unit_id" type="text" component={ CustomInput } />
                <ErrorMessage name="unit_id" component={ CustomError } />

                <Field label="N°ticket SNOW" name="snow_number" type="text" component={ CustomInput } />
                <ErrorMessage name="snow_number" component={ CustomError } />
                
                <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                </form>
            )}
            </Formik>
        </div>
      )
    }
  }
}
