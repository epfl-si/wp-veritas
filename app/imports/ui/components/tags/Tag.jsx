import React, { Component, Fragment } from 'react';
import { Tags } from '../../../api/collections';
import { Formik, Field, ErrorMessage } from 'formik';
import { CustomError, CustomInput, CustomSelect } from '../CustomFields';
import { Link } from "react-router-dom";

export default class Tag extends Component {

  constructor(props) {
    super(props);

    let action;
    if (this.props.match.path.startsWith('/tag/')) {
      action = 'edit';
    } else {
      action = 'add';
    }
    
    this.state = {
      hideUrlsField: false,
      saveSuccess: false,
      action: action,
      orderNameFr: 1,
      orderNameEn: 0,
      orderUrlFr: 0,
      orderUrlEn: 0,
      orderType: 0,
      tags: [],
      tag: '',
    }
  }
    
  componentWillMount() {

    Meteor.subscribe('tag.list');

    Tracker.autorun(() => {
      let tags = Tags.find({}, {sort: {name_fr: this.state.orderNameFr}}).fetch();
      let tag = '';
      if (this.state.action === 'edit') {
        tag = Tags.findOne({_id: this.props.match.params._id});
      }
      this.setState({tags: tags, tag:tag});  
    })      
  }

  submit = (values, actions) => {

    let meteorMethodName;
    if (this.state.action === 'add') {
      meteorMethodName = 'insertTag';
    } else if (this.state.action === 'edit') {
      meteorMethodName = 'updateTag';
    }

    if (values.type == 'field-of-research') {
      let firstPartUrl = 'https://www.epfl.ch/research/domains/cluster?field-of-research=';
      let nameFr = escape(values.name_fr);
      let nameEn = escape(values.name_en);
      values.url_fr = `${firstPartUrl}${nameFr}`;
      values.url_en = `${firstPartUrl}${nameEn}`;
    }

    Meteor.call(
      meteorMethodName,
      values, 
      (errors, siteId) => {
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
          actions.resetForm();
          if (meteorMethodName == 'updateTag') {
            this.props.history.push('/tags');
          }
          this.setState({saveSuccess: true});
        }
      }
    );
  }

  deleteTag(tagId) {
    Meteor.call(
      'removeTag',
      tagId,
      function(error, tagId) {
        if (error) {
          console.log(`ERROR deleteTag ${error}`);
        } 
      }
    );
  }

  sortNameFr() {
    let sort;
    if (this.state.orderNameFr == 0 || this.state.orderNameFr == 1) {
      sort = -1;
    } else if (this.state.orderNameFr == 0 || this.state.orderNameFr == -1) {
      sort = 1;
    }
    let tags = Tags.find({}, {sort: {name_fr: sort}}).fetch();
    this.setState({orderNameFr: sort, orderNameEn:0, orderType: 0, orderUrl:0, tags: tags});
  }

  sortNameEn() {
    let sort;
    if (this.state.orderNameEn == 0 || this.state.orderNameEn == 1) {
      sort = -1;
    } else if (this.state.orderNameEn == 0 || this.state.orderNameEn == -1) {
      sort = 1;
    }
    let tags = Tags.find({}, {sort: {name_en: sort}}).fetch();
    this.setState({orderNameFr:0, orderNameEn: sort, orderType: 0, orderUrl:0, tags: tags});
  }

  sortUrlFr() {
    let sort;
    if (this.state.orderUrlFr == 0 || this.state.orderUrlFr == 1) {
      sort = -1;
    } else if (this.state.orderUrlFr == 0 || this.state.orderUrlFr == -1) {
      sort = 1;
    }
    let tags = Tags.find({}, {sort: {url_fr: sort}}).fetch();
    this.setState({orderNameFr: 0, orderNameEn:0, orderType: 0, orderUrlFr:sort, orderUrlEn:0, tags: tags});
  }

  sortUrlEn() {
    let sort;
    if (this.state.orderUrlEn == 0 || this.state.orderUrlEn == 1) {
      sort = -1;
    } else if (this.state.orderUrlEn == 0 || this.state.orderUrlEn == -1) {
      sort = 1;
    }
    let tags = Tags.find({}, {sort: {url_en: sort}}).fetch();
    this.setState({orderNameFr: 0, orderNameEn:0, orderType: 0, orderUrlFr:0, orderUrlEn:sort, tags: tags});
  }

  sortType() {
    let sort;
    if (this.state.orderType == 0 || this.state.orderType == 1) {
      sort = -1;
    } else if (this.state.orderType == 0 || this.state.orderType == -1) {
      sort = 1;
    }
    let tags = Tags.find({}, {sort: {type: sort}}).fetch();
    this.setState({orderNameFr: 0, orderNameEn:0, orderType: sort, orderUrl:0, tags: tags});
  }

  updateSaveSuccess = () => {
    this.setState({saveSuccess: false});
  }
  
  hideUrls = (e) => {
    if (e.target.value == 'field-of-research') {
      this.setState({hideUrlsField: true});
    } else {
      this.setState({hideUrlsField: false});
    }
  }

  render() {
      
    let content;

    if ((!this.state.tags && this.state.action === 'add') || ((!this.state.tags || !this.state.tag) && this.state.action === 'edit')) {
      return "Loading";
    } else {

      let initialValues;
      let title;
      let edit;
      let orderNameFrClassName;
      let orderNameEnClassName;
      let orderUrlFrClassName;
      let orderUrlEnClassName;
      let orderTypeClassName;

      let msgSaveSuccess = (
        <div className="alert alert-success" role="alert">
          La modification a été enregistrée avec succès ! 
        </div> 
      )

      if (this.state.action === 'edit') {
        title = `Editer le tag ${this.state.tag.name_fr}`;
        initialValues = this.state.tag;
        edit = true;
      } else {
        title = 'Ajouter un tag';
        initialValues = {name_fr:'', name_en:'', url_fr: '', url_en: '', type: 'faculty'};
        edit = false;

        if (this.state.orderNameFr == 0) {
          orderNameFrClassName = "fa fa-fw fa-sort";
        } else if (this.state.orderNameFr == 1) {
          orderNameFrClassName = "fa fa-fw fa-sort-asc";
        } else if (this.state.orderNameFr == -1) {
          orderNameFrClassName = "fa fa-fw fa-sort-desc";
        }

        if (this.state.orderNameEn == 0) {
          orderNameEnClassName = "fa fa-fw fa-sort";
        } else if (this.state.orderNameEn == 1) {
          orderNameEnClassName = "fa fa-fw fa-sort-asc";
        } else if (this.state.orderNameEn == -1) {
          orderNameEnClassName = "fa fa-fw fa-sort-desc";
        }
        
        if (this.state.orderUrlFr == 0) {
          orderUrlFrClassName = "fa fa-fw fa-sort";
        } else if (this.state.orderUrlFr == 1) {
          orderUrlFrClassName = "fa fa-fw fa-sort-asc";
        } else if (this.state.orderUrlFr == -1) {
          orderUrlFrClassName = "fa fa-fw fa-sort-desc";
        }

        if (this.state.orderUrlEn == 0) {
          orderUrlEnClassName = "fa fa-fw fa-sort";
        } else if (this.state.orderUrlEn == 1) {
          orderUrlEnClassName = "fa fa-fw fa-sort-asc";
        } else if (this.state.orderUrlEn == -1) {
          orderUrlEnClassName = "fa fa-fw fa-sort-desc";
        }

        if (this.state.orderType == 0) {
          orderTypeClassName = "fa fa-fw fa-sort";
        } else if (this.state.orderType == 1) {
          orderTypeClassName = "fa fa-fw fa-sort-asc";
        } else if (this.state.orderType == -1) {
          orderTypeClassName = "fa fa-fw fa-sort-desc";
        }
      }

      content = (
        <Fragment>
          <div className="card my-2">
            <h5 className="card-header">{title}</h5>
            { this.state.saveSuccess && msgSaveSuccess }
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
                  <Field 
                    onChange={e => { handleChange(e); this.updateSaveSuccess();}} 
                    onBlur={e => { handleBlur(e); this.updateSaveSuccess();}} 
                    placeholder="Nom du tag en français" label="Nom [FR]" name="name_fr" 
                    type="text" component={ CustomInput } />
                  <ErrorMessage name="name_fr" component={ CustomError } />
                  
                  <Field
                    onChange={e => { handleChange(e); this.updateSaveSuccess();}} 
                    onBlur={e => { handleBlur(e); this.updateSaveSuccess();}}
                    placeholder="Nom du tag en anglais" label="Nom [EN]" name="name_en" 
                    type="text" component={ CustomInput } />
                  <ErrorMessage name="name_en" component={ CustomError } />
                  
                  <Field 
                    onChange={e => { handleChange(e); this.hideUrls(e); this.updateSaveSuccess(); }}
                    onBlur={e => { handleBlur(e); this.updateSaveSuccess(); }}
                    label="Type" name="type" component={ CustomSelect } >
                    <option value="faculty">Faculté</option>
                    <option value="institute">Institut</option>
                    <option value="field-of-research">Domaine de recherche</option>                        
                  </Field>
                  <ErrorMessage name="type" component={ CustomError } />
                  
                  { this.state.hideUrlsField ? '' : (
                  <Fragment>
                    <Field 
                      onChange={e => { handleChange(e); this.updateSaveSuccess();}} 
                      onBlur={e => { handleBlur(e); this.updateSaveSuccess();}}
                      placeholder="URL du tag en français" label="URL [FR]" name="url_fr" type="text" component={ CustomInput } />
                    <ErrorMessage name="url_fr" component={ CustomError } />
                    
                    <Field 
                      onChange={e => { handleChange(e); this.updateSaveSuccess();}} 
                      onBlur={e => { handleBlur(e); this.updateSaveSuccess();}}
                      placeholder="URL du tag en anglais" label="URL [EN]" name="url_en" type="text" component={ CustomInput } />
                    <ErrorMessage name="url_en" component={ CustomError } />
                  </Fragment>
                  )}

                  <div className="my-1 text-right">
                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                  </div>
                                
                </form>
              )}
            </Formik>
          </div>
          { edit ? '' : (
          <div className="card my-2">
            <h5 className="card-header">Liste des tags</h5>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Nom FR <i className={orderNameFrClassName} onClick={() => this.sortNameFr() }></i></th>
                  <th scope="col">Nom EN <i className={orderNameEnClassName} onClick={() => this.sortNameEn() }></i></th>
                  <th scope="col" className="special">URL FR <i className={orderUrlFrClassName} onClick={() => this.sortUrlFr() }></i></th>
                  <th scope="col" className="special">URL EN <i className={orderUrlEnClassName} onClick={() => this.sortUrlEn() }></i></th>
                  <th scope="col">Type <i className={orderTypeClassName} onClick={() => this.sortType() }></i></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {this.state.tags.map( (tag, index) => (
                  <tr key={tag._id}>
                    <td>{index+1}</td>
                    <td>{tag.name_fr}</td>
                    <td>{tag.name_en}</td>
                    <td className="special"><a href={tag.url_fr} target="_blank">{tag.url_fr}</a></td>
                    <td className="special"><a href={tag.url_en} target="_blank">{tag.url_en}</a></td>
                    <td>{tag.type}</td>
                    <td>
                      <Link className="mr-2" to={`/tag/${tag._id}`}>
                        <button type="button" className="btn btn-outline-primary">Éditer</button>
                      </Link>
                      <button type="button" className="close" aria-label="Close">
                        <span  onClick={() => { if (window.confirm('Are you sure you wish to delete this item?')) this.deleteTag(tag._id) }} aria-hidden="true">&times;</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Fragment>
      )}
    return content;
  }
}