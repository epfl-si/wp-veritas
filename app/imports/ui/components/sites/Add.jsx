import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Formik, Field, ErrorMessage } from 'formik';
import { Sites, OpenshiftEnvs, Types, Themes, Categories } from '../../../api/collections';
import { CustomSingleCheckbox, CustomCheckbox, CustomError, CustomInput, CustomSelect, CustomTextarea } from '../CustomFields';
import { Loading } from '../Messages'

class Add extends Component {

  constructor(props){
    super(props);
    
    let action;
    if (this.props.match.path.startsWith('/edit')) {
      action = 'edit';
    } else {
      action = 'add';
    }

    this.state = {
      action: action,
      addSuccess: false,
      editSuccess: false,
    }
  }

  updateUserMsg = () => {
    this.setState({addSuccess: false, editSuccess: false});
  }

  getSite = () => {
    for (let site of this.props.sites) {
      if (site._id == this.props.match.params._id) {
        return site
      }
    }
    return null;
  }
    
  submit = (values, actions) => {
    
    let methodName;
    let state;

    if (this.state.action === 'add') {
      methodName = 'insertSite';
      state = {addSuccess: true, editSuccess: false, action: 'add'};
    } else if (this.state.action === 'edit') {
      methodName = 'updateSite';
      state = {addSuccess: false, editSuccess: true, action: 'edit'};
    }

    Meteor.call(
      methodName,
      values, 
      (errors, siteId) => {
        if (errors) {
          let formErrors = {};
          errors.details.forEach(function(error) {
            formErrors[error.name] = error.message;                        
          });
          actions.setErrors(formErrors);
          actions.setSubmitting(false);
        } else {
          actions.setSubmitting(false);
          if (this.state.action === 'add') {
            actions.resetForm();
          }
          this.setState(state);
        }
      }
    );
  }

  getInitialValues = () => {
    let initialValues;
    
    if (this.state.action == 'add') {
      initialValues = { 
        url: '',
        slug: '',
        tagline: '', 
        title: '', 
        openshiftEnv: 'www', 
        type: 'public', 
        theme:'2018',
        category:'GeneralPublic',
        faculty: '',
        languages: [], 
        unitId: '', 
        snowNumber: '',
        status:'requested',
        comment: '',
        plannedClosingDate: '',
        tags: []
      }
    } else if (this.state.action == 'edit') {
      initialValues = this.getSite();
    }
    return initialValues;
  }

  isLoading = (initialValues) => {

    const isLoading = (
      this.props.openshiftenvs === undefined || 
      this.props.types === undefined || 
      this.props.themes === undefined ||
      this.props.categories === undefined ||
      initialValues === undefined
    )
    return isLoading;
  }

  getPageTitle = () => {
    let title;
    if (this.state.action === 'edit') {
      title = 'Modifier le site ci-dessous';
    } else { 
      title = 'Ajouter un nouveau site';
    }
    return title;
  }

  render() {
    let content;
    let initialValues = this.getInitialValues();

    if (this.isLoading(initialValues)) {
      content = <Loading />
    } else {
      
      let msgAddSuccess = (
        <div className="alert alert-success" role="alert">
          Le nouveau site a été ajouté avec succès ! 
        </div> 
      )

      let msgEditSuccess = (
        <div className="alert alert-success" role="alert">
          Le site a été modifié avec succès ! 
        </div> 
      )

      content = (
          
        <div className="card my-2">
            <h5 className="card-header">{ this.getPageTitle() }</h5> 
            { this.state.addSuccess && msgAddSuccess }
            { this.state.editSuccess && msgEditSuccess }
            <Formik
            onSubmit={ this.submit }
            initialValues={ initialValues }
            validateOnBlur={ false }
            validateOnChange={ false }
            >
            { ({
                handleSubmit,
                handleChange,
                handleBlur,
                isSubmitting,
                values,
            }) => (
              
                <form onSubmit={ handleSubmit } className="bg-white border p-4">
                <div className="my-1 text-right">
                  <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                </div>
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  placeholder="URL du site à ajouter" label="URL" name="url" type="text" component={ CustomInput } />
                <ErrorMessage name="url" component={ CustomError } />
                
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  placeholder="Tagline du site à ajouter" label="Tagline" name="tagline" type="text" component={ CustomInput } />
                <ErrorMessage name="tagline" component={ CustomError } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  placeholder="Titre du site à ajouter" label="Titre" name="title" type="text" component={ CustomInput } />
                <ErrorMessage name="title" component={ CustomError } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Openshift Environnement" name="openshiftEnv" component={ CustomSelect }>
                  {this.props.openshiftenvs.map( (env, index) => (
                  <option key={env._id} value={env.name}>{env.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="openshiftEnv" component={ CustomError } />
                
                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Type" name="type" component={ CustomSelect } >
                {this.props.types.map( (type, index) => (
                  <option key={type._id} value={type.name}>{type.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="type" component={ CustomError } />
                
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Catégorie" name="category" component={ CustomSelect } >
                {this.props.categories.map( (category, index) => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="category" component={ CustomError } />

                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Thème" name="theme" component={ CustomSelect } >
                {this.props.themes.map( (theme, index) => (
                  <option key={theme._id} value={theme.name}>{theme.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="theme" component={ CustomError } />

                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  placeholder="Faculté du site à ajouter" label="Faculté" name="faculty" type="text" component={ CustomInput } />
                <ErrorMessage name="faculty" component={ CustomError } />
                
                <h6>Langues</h6>                  
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Français" name="languages" type="checkbox" value="fr" 
                  component={ CustomCheckbox } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Anglais" name="languages" type="checkbox" value="en" component={ CustomCheckbox } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Allemand" name="languages" type="checkbox" value="de" component={ CustomCheckbox } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Italien" name="languages" type="checkbox" value="it" component={ CustomCheckbox } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Espagnol" name="languages" type="checkbox" value="es" component={ CustomCheckbox } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Grec" name="languages" type="checkbox" value="el" component={ CustomCheckbox } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Roumain" name="languages" type="checkbox" value="ro" component={ CustomCheckbox } />
                <ErrorMessage name="languages" component={ CustomError } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  placeholder="ID de l'unité du site à ajouter" label="Unit ID" name="unitId" type="text" component={ CustomInput } />
                <ErrorMessage name="unitId" component={ CustomError } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}  
                  onBlur={this.updateUserMsg} 
                  placeholder="N° du ticket du site à ajouter" label="N°ticket SNOW" name="snowNumber" type="text" component={ CustomInput } />
                <ErrorMessage name="snowNumber" component={ CustomError } />
                
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Date de fermeture planifiée" name="plannedClosingDate" type="date" component={ CustomInput } />
                <ErrorMessage name="plannedClosingDate" component={ CustomError } />

                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Statut" name="status" component={ CustomSelect } >
                  <option value="requested">Demandé</option>
                  <option value="created">Créé</option>
                  <option value="in-preparation">En préparation</option>
                  <option value="no-wordpress">Non WordPress</option>
                  <option value="archived">Archivé</option>
                  <option value="trashed">Mis en corbeille</option>
                </Field>

                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="À observer avec ressenti" name="userExperience" type="checkbox" 
                  component={ CustomSingleCheckbox } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}  
                  onBlur={this.updateUserMsg} 
                  placeholder="" label="Slug pour le ressenti" name="slug" type="text" component={ CustomInput } />
                <ErrorMessage name="slug" component={ CustomError } />
                
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Commentaire" name="comment" component={CustomTextarea} />
                <ErrorMessage name="comment" component={ CustomError } />
                <div className="my-1 text-right">
                  <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                </div>
                {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                </form>
                
            )}
            </Formik>
            { this.state.addSuccess && msgAddSuccess }
            { this.state.editSuccess && msgEditSuccess }
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
    Meteor.subscribe('category.list');
    // TODO : call site.single 
    Meteor.subscribe('site.list');
      
    return {
      openshiftenvs: OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch(),
      types: Types.find({}, {sort: {name:1 }}).fetch(),
      themes: Themes.find({}, {sort: {name:1 }}).fetch(),
      categories: Categories.find({}, {sort: {name:1 }}).fetch(),
      sites: Sites.find({}),
    };  
})(Add);