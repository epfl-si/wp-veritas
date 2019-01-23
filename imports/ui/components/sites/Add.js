import React from 'react';
import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import { Sites, OpenshiftEnvs, Types, Themes } from '../../../api/collections';
import { CustomCheckbox, CustomError, CustomInput, CustomSelect } from './CustomFields';
import { BAD_URL_MSG, REQUIRED_MSG, LANGUAGES_MSG } from '../Messages';

export default class Add extends React.Component {

  siteSchema = Yup.object().shape({
      url: Yup.string().url(BAD_URL_MSG).required(REQUIRED_MSG),
      tagline: Yup.string(),
      title: Yup.string().required(REQUIRED_MSG),
      openshift_env: Yup.string().required(REQUIRED_MSG),
      type: Yup.string().required(REQUIRED_MSG),
      category: Yup.string(),
      theme: Yup.string().required(REQUIRED_MSG),
      faculty: Yup.string(),
      languages: Yup.array().required(LANGUAGES_MSG),
      unit_id: Yup.string().required(REQUIRED_MSG),
      snow_number: Yup.string(),
      comment: Yup.string(),
      planned_closing_date: Yup.date()
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
        action: action,
        openshiftenvs: [],
        types: [],
        themes: [],
    }
  } 

  componentDidMount() {
    
    Tracker.autorun(()=>{
      let openshiftenvs = OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch();
      let types = Types.find({}, {sort: {name:1 }}).fetch();
      let themes = Themes.find({}, {sort: {name:1 }}).fetch();
      this.setState({openshiftenvs: openshiftenvs, types: types, themes: themes});
    });

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
    } else if (this.state.action === 'edit') {
      Sites.update({_id:this.props.match.params._id}, { $set:values});
    }
    this.props.history.push('/list');
  }

  render() {
    let content;
    const isLoading = (this.state.site === undefined || this.state.site === '')  && this.state.action === 'edit';
    
    if (isLoading) {
      content = <h1>Loading....</h1>
    } else {

      let initialValues;
      let title;
      
      if (this.state.action === 'edit') {
      
        title = 'Modifier le site ci-dessous'
        initialValues = this.state.site;
      
      } else { 
      
        title = 'Ajouter un nouveau site';
        initialValues = { 
          url: '', 
          tagline:'', 
          title:'', 
          openshift_env: 'www', 
          type: 'public', 
          theme:'2018',
          faculty:'',
          languages: [], 
          unit_id:'', 
          snow_number:'',
          comment:'',
          planned_closing_date: ''
        }
      }

      content = (
          
        <div className="container-fluid p-5 bg-light d-flex flex-column justify-content-center align-items-center">
        
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
                values,
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
                  {this.state.openshiftenvs.map( (env, index) => (
                  <option key={env._id} value={env.name}>{env.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="openshift_env" component={ CustomError } />
                
                <Field label="Type" name="type" type="text" component={ CustomSelect } >
                {this.state.types.map( (type, index) => (
                  <option key={type._id} value={type.name}>{type.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="type" component={ CustomError } />
                
                <Field label="Category" name="category" type="text" component={ CustomInput } />
                <ErrorMessage name="category" component={ CustomError } />

                <Field label="Thème" name="theme" type="text" component={ CustomSelect } >
                {this.state.themes.map( (theme, index) => (
                  <option key={theme._id} value={theme.name}>{theme.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="theme" component={ CustomError } />

                <Field label="Faculté" name="faculty" type="text" component={ CustomInput } />
                <ErrorMessage name="faculty" component={ CustomError } />
                
                <h6>Langues</h6>                  
                <Field label="FR" name="languages" type="checkbox" value="fr" component={ CustomCheckbox } />
                <Field label="EN" name="languages" type="checkbox" value="en" component={ CustomCheckbox } />
                <ErrorMessage name="languages" component={ CustomError } />

                <Field label="Unit ID" name="unit_id" type="text" component={ CustomInput } />
                <ErrorMessage name="unit_id" component={ CustomError } />

                <Field label="N°ticket SNOW" name="snow_number" type="text" component={ CustomInput } />
                <ErrorMessage name="snow_number" component={ CustomError } />
                
                <Field label="Date de fermeture planifiée" name="planned_closing_date" type="date" component={ CustomInput } />
                <ErrorMessage name="snow_number" component={ CustomError } />

                <div className="form-group">
                  <label htmlFor="comment">Commentaire</label>
                  <textarea className="form-control" id="comment" name="comment" rows="5" cols="33"></textarea>
                </div>
                
                <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                <pre>{JSON.stringify(values, null, 2)}</pre>
                </form>

            )}
            </Formik>
        </div>
      )
    }
    return content;
  }
}
