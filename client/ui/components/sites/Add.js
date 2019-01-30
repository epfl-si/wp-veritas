import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import { Sites, OpenshiftEnvs, Types, Themes } from '../../../../both/collections';
import { CustomCheckbox, CustomError, CustomInput, CustomSelect, CustomTextarea } from './CustomFields';
import { BAD_URL_MSG, REQUIRED_MSG, LANGUAGES_MSG } from '../Messages';

class Add extends React.Component {

  siteSchema = Yup.object().shape({
      url: Yup.string().url(BAD_URL_MSG).required(REQUIRED_MSG),
      tagline: Yup.string(),
      
      title: Yup.string().required(REQUIRED_MSG),
      openshiftEnv: Yup.string().required(REQUIRED_MSG),
      type: Yup.string().required(REQUIRED_MSG),
      category: Yup.string(),
      theme: Yup.string().required(REQUIRED_MSG),
      faculty: Yup.string(),
      languages: Yup.array().required(LANGUAGES_MSG),
      unitId: Yup.string().required(REQUIRED_MSG),
      snowNumber: Yup.string(),
      comment: Yup.string(),
      plannedClosingDate: Yup.date()
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
    }
  } 

  getSite = async () => {
    let site = await Sites.findOne({_id: this.props.match.params._id});
    return site;
  }

  componentDidMount() {
    
    if (this.state.action === 'edit') {
      let site = this.getSite().then((site) => {
        this.setState({site: site});
      });
    }
  }
    
  submit = (values, actions) => {
    if (this.state.action === 'add') {
      Meteor.call(
        'insertSite',
        values, 
        function(error, siteId) {
          if (error) {
          } else {
            this.props.history.push('/list');
          }
        }
      );
    } else if (this.state.action === 'edit') {

      Meteor.call(
        'updateSite',
        values, 
        (error, siteId) => {
          if (error) {
          } else {
            this.props.history.push('/list');
          }
        }
      );
    }
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
          openshiftEnv: 'www', 
          type: 'public', 
          theme:'2018',
          faculty:'',
          languages: [], 
          unitId:'', 
          snowNumber:'',
          comment:'',
          plannedClosingDate: ''
        }
      }

      content = (
          
        <div className="card my-2">
            <h5 className="card-header">{title}</h5> 
        
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
              
                <form onSubmit={ handleSubmit } className="bg-white border p-4">
                 
                <Field placeholder="URL du site à ajouter" label="URL" name="url" type="url" component={ CustomInput } />
                <ErrorMessage name="url" component={ CustomError } />
                
                <Field placeholder="Tagline du site à ajouter" label="Tagline" name="tagline" type="text" component={ CustomInput } />
                <ErrorMessage name="tagline" component={ CustomError } />

                <Field placeholder="Titre du site à ajouter" label="Titre" name="title" type="text" component={ CustomInput } />
                <ErrorMessage name="title" component={ CustomError } />

                <Field label="Openshift Environnement" name="openshiftEnv" component={ CustomSelect }>
                  {this.props.openshiftenvs.map( (env, index) => (
                  <option key={env._id} value={env.name}>{env.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="openshiftEnv" component={ CustomError } />
                
                <Field label="Type" name="type" type="text" component={ CustomSelect } >
                {this.props.types.map( (type, index) => (
                  <option key={type._id} value={type.name}>{type.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="type" component={ CustomError } />
                
                <Field placeholder="Catégorie du site à ajouter" label="Catégorie" name="category" type="text" component={ CustomInput } />
                <ErrorMessage name="category" component={ CustomError } />

                <Field label="Thème" name="theme" type="text" component={ CustomSelect } >
                {this.props.themes.map( (theme, index) => (
                  <option key={theme._id} value={theme.name}>{theme.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="theme" component={ CustomError } />

                <Field placeholder="Faculté du site à ajouter" label="Faculté" name="faculty" type="text" component={ CustomInput } />
                <ErrorMessage name="faculty" component={ CustomError } />
                
                <h6>Langues</h6>                  
                <Field label="FR" name="languages" type="checkbox" value="fr" component={ CustomCheckbox } />
                <Field label="EN" name="languages" type="checkbox" value="en" component={ CustomCheckbox } />
                <ErrorMessage name="languages" component={ CustomError } />

                <Field placeholder="ID de l'unité du site à ajouter" label="Unit ID" name="unitId" type="text" component={ CustomInput } />
                <ErrorMessage name="unitId" component={ CustomError } />

                <Field placeholder="N° du ticket du site à ajouter" label="N°ticket SNOW" name="snowNumber" type="text" component={ CustomInput } />
                <ErrorMessage name="snowNumber" component={ CustomError } />
                
                <Field label="Date de fermeture planifiée" name="plannedClosingDate" type="date" component={ CustomInput } />
                <ErrorMessage name="plannedClosingDate" component={ CustomError } />

                <Field label="Commentaire" name="comment" component={CustomTextarea} />
                <ErrorMessage name="comment" component={ CustomError } />
                
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

export default withTracker(() => {
    Meteor.subscribe('openshiftEnv.list');
    Meteor.subscribe('type.list');
    Meteor.subscribe('theme.list');

    return {
        openshiftenvs: OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch(),
        types: Types.find({}, {sort: {name:1 }}).fetch(),
        themes: Themes.find({}, {sort: {name:1 }}).fetch(),
        
    };  
})(Add);