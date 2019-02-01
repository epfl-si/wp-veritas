import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import { Sites, OpenshiftEnvs, Types, Themes } from '../../../../both/collections';
import { CustomCheckbox, CustomError, CustomInput, CustomSelect, CustomTextarea } from './CustomFields';
import Messages from '../Messages';

class Add extends React.Component {

  siteSchema = Yup.object().shape({
      url: Yup.
        string().
        url(Messages.BAD_URL_MSG).
        required(Messages.REQUIRED_MSG).
        min(19, Messages.MIN_19_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG).
        test('checkStartsWithURL', Messages.URL_STARTSWITH_MSG, 
          function(url) {
            let validate = false;
            if (url.startsWith('https://')) {
              validate = true;
            }
            return validate;
          }),
      tagline: Yup.
        string().
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      title: Yup.
        string().
        required(Messages.REQUIRED_MSG).
        min(2, Messages.MIN_2_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      openshiftEnv: Yup.
        string().
        required(Messages.REQUIRED_MSG).
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      type: Yup.
        string().
        required(Messages.REQUIRED_MSG).
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      category: Yup.
        string().
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      theme: Yup.
        string().
        required(Messages.REQUIRED_MSG).
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      faculty: Yup.
        string().
        min(2, Messages.MIN_2_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      languages: Yup.
        array().
        required(Messages.LANGUAGES_MSG),
      unitId: Yup.
        string().
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG).
        required(Messages.REQUIRED_MSG),
      snowNumber: Yup.
        string().
        min(3, Messages.MIN_3_CHAR_MSG).
        max(100, Messages.MAX_100_CHAR_MSG),
      comment: Yup.
        string().
        min(3, Messages.MIN_3_CHAR_MSG).
        max(255, Messages.MAX_255_CHAR_MSG),
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
        add_success: false,
        edit_success: false,
        error: '',
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
        (errors, siteId) => {
          if (errors) {
            this.setState({error: errors.error})
            actions.setSubmitting(false);
          } else {
            actions.setSubmitting(false);
            actions.resetForm(); 
            this.setState({add_success: true});
          }
        }
      );
    } else if (this.state.action === 'edit') {

      Meteor.call(
        'updateSite',
        values, 
        (errors, siteId) => {
          if (errors) {
            console.log(errors);
          } else {
            actions.setSubmitting(false);
            actions.resetForm(); 
            this.setState({edit_success: true});
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
      let error = this.state.error;

      let msg_add_success = (
        <div className="alert alert-success" role="alert">
          Le nouveau site a été ajouté avec succès ! 
        </div> 
      )

      let msg_edit_success = (
        <div className="alert alert-success" role="alert">
          Le site a été modifié avec succès ! 
        </div> 
      )
      
      let msg_error = (
        <div className="alert alert-danger" role="alert">
          { error }
        </div> 
      )
      
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
            { this.state.add_success && msg_add_success }
            { this.state.edit_success && msg_edit_success }
            { this.state.error && msg_error }
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
                <div className="my-1 text-right">
                  <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                </div>
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
                <div className="my-1 text-right">
                  <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                </div>
                <pre>{JSON.stringify(values, null, 2)}</pre>
                </form>
                
            )}
            </Formik>
            { this.state.add_success && msg_add_success }
            { this.state.edit_success && msg_edit_success }
            { this.state.error && msg_error }
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