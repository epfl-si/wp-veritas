import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Formik, Field, ErrorMessage } from 'formik';
import { Sites, OpenshiftEnvs, Themes, Categories } from '../../../api/collections';
import { CustomSingleCheckbox, CustomCheckbox, CustomError, CustomInput, CustomSelect, CustomTextarea } from '../CustomFields';
import Select from "react-select";
import { Loading } from '../Messages';

class Add extends Component {

  constructor(props){
    super(props);

    let action;
    let unitName = '';
    if (this.props.match.path.startsWith('/edit')) {
      action = 'edit';
      if ('site' in props && props.site) {
        unitName = props.site.unitName;
      }
    } else {
      action = 'add';
    }

    this.state = {
      action: action,
      addSuccess: false,
      editSuccess: false,
      saveSuccess: false,
      unitName: unitName
    }
  }

  updateFields = (event, values) => {
    if (event.target.checked === false) {
      values.openshiftEnv = "";
      values.category = "";
      values.theme = "";
      values.unitId = "";
      values.languages = [];
      values.categories = [];
    } else {
      values.openshiftEnv = "www";
      values.category = "GeneralPublic";
      values.theme = "wp-theme-2018";
    }
  }

  updateUserMsg = () => {
    this.setState({addSuccess: false, editSuccess: false});
  }

  updateSaveSuccess = (newValue) => {
    this.setState({ saveSuccess: newValue });
  }

  submit = (values, actions) => {

    let methodName;
    let state;

    if (this.state.action === 'add') {
      methodName = 'insertSite';
      state = {addSuccess: true, editSuccess: false, action: 'add'};
    } else if (this.state.action === 'edit') {
      methodName = 'updateSite';
      if (values.categories === null) {
        values.categories = [];
      }
      state = {addSuccess: false, editSuccess: true, action: 'edit'};
    }

    Meteor.call(
      methodName,
      values, 
      (errors, site) => {
        if (errors) {
          console.log(errors);
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
          state.unitName = site.unitName;
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
        userExperienceUniqueLabel: '',
        tagline: '', 
        title: '', 
        openshiftEnv: 'www', 
        theme: 'wp-theme-2018',
        category: 'GeneralPublic',
        categories: [],
        languages: [], 
        unitId: '', 
        snowNumber: '',
        comment: '',
        tags: [],
        professors: [],
        wpInfra: true,
      }
    } else if (this.state.action == 'edit') {
      initialValues = this.props.site;
    }
    return initialValues;
  }

  isLoading = (initialValues) => {

    const isLoading = (
      this.props.openshiftenvs === undefined || 
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

      if (this.action === 'edit' && this.state.unitName === '') {
        this.setState({"unitName": this.props.site.unitName})
      }

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
                touched,
                errors,
                setFieldValue,
                setFieldTouched
            }) => (
              
                <form onSubmit={ handleSubmit } className="bg-white border p-4">
                <div className="my-1 text-right">
                  <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                </div>
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg(); }}
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
                  onChange={e => { handleChange(e); this.updateFields(e, values); this.updateUserMsg(); }}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Site dans l'infrastructure WordPress VPSI ?" name="wpInfra" type="checkbox"
                  checked={ values.wpInfra }
                  component={ CustomSingleCheckbox }
                  />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Environnement Openshift"
                  name="openshiftEnv"
                  component={ CustomSelect }
                  disabled = { values.wpInfra === false } >
                  { values.wpInfra === false ?
                  <option key="blank" value="blank" label=""></option>
                  : null }
                  {this.props.openshiftenvs.map( (env, index) => (
                  <option key={env._id} value={env.name} label={env.name} >{env.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="openshiftEnv" component={ CustomError } />
                {/*
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  label="Catégorie"
                  name="category"
                  component={ CustomSelect }
                  disabled = { values.wpInfra === false }
                  >
                  { values.wpInfra === false ?
                  <option key="blank" value="blank" label=""></option>
                  : null }
                  {this.props.categories.map( (category, index) => (
                  <option key={category._id} value={category.name} label={category.name}>{category.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="category" component={ CustomError } />
                  */}
                <div className="form-group">
                Catégories
                <MyCategorySelect
                  id="categories"
                  value={values.categories}
                  onChange={setFieldValue}
                  onBlur={setFieldTouched}
                  error={errors.categories}
                  touched={touched.categories}
                  options={this.props.categories}
                  saveSuccess={this.updateSaveSuccess}
                  placeholder="Sélectionner les catégories"
                  name="categories"
                  isDisabled={values.wpInfra === false}
                />
                </div>

                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg(); }}
                  onBlur={e => { handleBlur(e); this.updateUserMsg(); }}
                  label="Thème"
                  name="theme"
                  component={ CustomSelect }
                  disabled = { values.wpInfra === false }
                  >
                  { values.wpInfra === false ?
                  <option key="blank" value="blank" label=""></option>
                  : null }
                  {this.props.themes.map( (theme, index) => (
                  <option key={theme._id} value={theme.name} label={theme.name}>{theme.name}</option>
                  ))}
                </Field>

                <ErrorMessage name="theme" component={ CustomError } />

                <h6>Langues</h6>                  
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Français" name="languages" type="checkbox" value="fr" 
                  component={ CustomCheckbox } 
                  disabled = { values.wpInfra === false } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Anglais" name="languages" type="checkbox" value="en" 
                  component={ CustomCheckbox } 
                  disabled = { values.wpInfra === false } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Allemand" name="languages" type="checkbox" value="de" 
                  component={ CustomCheckbox } 
                  disabled = { values.wpInfra === false } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Italien" name="languages" type="checkbox" value="it" 
                  component={ CustomCheckbox }
                  disabled = { values.wpInfra === false } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Espagnol" name="languages" type="checkbox" value="es" 
                  component={ CustomCheckbox }
                  disabled = { values.wpInfra === false } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Grec" name="languages" type="checkbox" value="el" 
                  component={ CustomCheckbox }
                  disabled = { values.wpInfra === false } />
                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="Roumain" name="languages" type="checkbox" value="ro" 
                  component={ CustomCheckbox }
                  disabled = { values.wpInfra === false } />
                <ErrorMessage name="languages" component={ CustomError } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  placeholder="ID de l'unité du site à ajouter" label="Unit ID" name="unitId" type="text"
                  component={ CustomInput }
                  disabled = { values.wpInfra === false } />
                <ErrorMessage name="unitId" component={ CustomError } />
                
                { this.state.action === 'edit' && this.state.unitName ?
                (<div className="form-group">
                  <label htmlFor="unitName">Nom de l'unité :</label>
                  <input
                    className="form-control"
                    id="unitName"
                    type="text"
                    disabled
                    value={ this.state.unitName }
                  />
                </div>) : null }

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}}
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                  onBlur={this.updateUserMsg}
                  placeholder="N° du ticket du site à ajouter" label="N°ticket SNOW" name="snowNumber" type="text"
                  component={ CustomInput } />
                <ErrorMessage name="snowNumber" component={ CustomError } />

                <Field 
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}} 
                  label="À observer avec ressenti" name="userExperience" type="checkbox"
                  checked={ values.userExperience }
                  component={ CustomSingleCheckbox } />

                <Field
                  onChange={e => { handleChange(e); this.updateUserMsg();}} 
                  onBlur={e => { handleBlur(e); this.updateUserMsg();}}  
                  onBlur={this.updateUserMsg}
                  placeholder="Libellé doit être unique" label="Libellé pour le ressenti" name="userExperienceUniqueLabel" type="text"
                  component={ CustomInput } />
                <ErrorMessage name="userExperienceUniqueLabel" component={ CustomError } />
                
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
export default withTracker((props) => {

  Meteor.subscribe('openshiftEnv.list');
  Meteor.subscribe('theme.list');
  Meteor.subscribe('category.list');

  let sites;

  if (props.match.path === "/edit/:_id") {
    Meteor.subscribe('siteById', props.match.params._id);
    sites = Sites.find({_id: props.match.params._id}).fetch();
    return {
      openshiftenvs: OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch(),
      themes: Themes.find({}, {sort: {name:1 }}).fetch(),
      categories: Categories.find({}, {sort: {name:1 }}).fetch(),
      site: sites[0]
    };
  } else {
    return {
      openshiftenvs: OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch(),
      themes: Themes.find({}, {sort: {name:1 }}).fetch(),
      categories: Categories.find({}, {sort: {name:1 }}).fetch(),
    };
  }
})(Add);



class MyCategorySelect extends React.Component {
  handleChange = (value) => {
    console.log(value)
    // this is going to call setFieldValue and manually update values.topcis
    this.props.onChange(this.props.name, value);
    this.props.saveSuccess(!this.props.saveSuccess);
  };

  handleBlur = () => {
    // this is going to call setFieldTouched and manually update touched.topcis
    this.props.onBlur(this.props.name, true);
    this.props.saveSuccess(!this.props.saveSuccess);
  };

  render() {
    let content;

    content = (
      <div className="multiCategoriesSelectContainer" style={{ margin: "1rem 0" }}>
        <Select
          isMulti
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          value={this.props.value}
          options={this.props.options}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option._id}
          placeholder={this.props.placeholder}
          isDisabled={this.props.isDisabled}
          styles={{
            control: styles => ({
              ...styles,
              borderColor: this.props.error ? 'red' : styles.borderColor
            })
          }}
          className="multiCategoriesSelect"
        />
        {!!this.props.error && (
          <div style={{ color: "red", marginTop: ".5rem" }}>
            {this.props.error}
          </div>
        )}
      </div>
    );

    return content;
  }
}