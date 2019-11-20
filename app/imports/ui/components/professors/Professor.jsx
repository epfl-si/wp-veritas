import React, { Component, Fragment } from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Formik, Field, ErrorMessage } from 'formik';
import { Professors } from '../../../api/collections';
import { CustomError, CustomInput } from '../CustomFields';
import { Link } from 'react-router-dom';
import { AlertSuccess, Loading } from '../Messages';

class ProfessorsList extends Component {

  render() { 
    return (
      <Fragment>
        <h5 className="card-header">Liste des professeurs</h5>
        <ul className="list-group">
          {this.props.professors.map( (professor, index) => (
            <li key={ professor._id } className="list-group-item">
              { professor.sciper }&nbsp;
              { professor.displayName }
              <button type="button" className="close" aria-label="Close">
                <span  onClick={() => this.props.callBackDeleteProfessor(professor._id)} aria-hidden="true">&times;</span>
              </button>

            </li>
          ))}
        </ul>
      </Fragment>
    )
  }
}

class Professor extends Component {

  constructor(props) {
    super(props);

    let action;
    if (this.props.match.path == '/professor/:_id/edit') {
      action = 'edit';
    } else {
      action = 'add';
    }
    
    this.state = {
      action: action,
      addSuccess: false,
      editSuccess: false,
      deleteSuccess: false,
    }
  }

  deleteProfessor = (professorID) => {
    Meteor.call(
      'removeProfessor',
      professorID,
      (error, professorID) => {
        if (error) {
            console.log(`ERROR Professor removeProfessor ${error}`);
        } else {
          this.setState({deleteSuccess: true});
        }
      }
    );
  }

  updateUserMsg = () => {
    this.setState({addSuccess: false, editSuccess: false, deleteSuccess: false,});
  }

  submitProfessor = (values, actions) => {

    let state;

    Meteor.call(
      'getLDAPInformations',
      values.sciper,
      (error, professorInformation) => {
        if (error) {
          console.log(`ERROR ${error}`);
        } else {

          let values = { 
            'sciper': professorInformation.sciper, 
            'displayName': professorInformation.displayName
          }

          Meteor.call(
            'insertProfessor',
            values, 
            (errors, ProfessorId) => {
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
                this.setState(state);
              }
            }
          );
        }
      }
    )
  }

  getProfessor = () => {
    // Get the URL parameter
    let professorId = this.props.match.params._id;
    let professor = Professors.findOne({_id: professorId});
    return professor;
  }

  getInitialValues = () => {
    let initialValues;
    if (this.state.action == 'add') {
      initialValues = { sciper: '' };
    } else {
      initialValues = this.getProfessor();
    }
    //console.log(this.state.action);
    return initialValues;
  }
  
  render() {

    

    let content;
    let initialValues = this.getInitialValues();
    let isLoading = (this.props.professors == undefined || initialValues == undefined);

    if (isLoading) {
      content = <Loading />;
    } else {

      const isDisplayProfessorsList = (this.state.action == 'add');

      content = (
        <Fragment>
          { this.state.deleteSuccess ? ( 
            <AlertSuccess message={ 'Le professeur a été supprimé avec succès !' } />
          ) : (null) }

          { isDisplayProfessorsList ? (
            <ProfessorsList 
              professors={this.props.professors} 
              callBackDeleteProfessor={this.deleteProfessor} 
            />
          ):(<h5 className="card-header">Édition du professeur suivant: </h5>)}
          <div className="card-body">

            { this.state.addSuccess ? ( 
              <AlertSuccess message={ 'Le nouveau professeur a été ajouté avec succès !' } />
            ) : (null) }

            { this.state.editSuccess ? ( 
              <AlertSuccess message={ 'Le professeur a été modifié avec succès !' } />
            ) : (null) }

            { this.state.deleteSuccess ? ( 
              <AlertSuccess message={ 'Le professeur a été supprimé avec succès !' } />
            ) : (null) }
            
            <Formik
              onSubmit={ this.submitProfessor }
              initialValues={ initialValues }
              validateOnBlur={ false }
              validateOnChange={ false }
                >
                {({
                    handleSubmit,
                    isSubmitting,
                    handleChange,
                    handleBlur,
                }) => (    
                  <form onSubmit={ handleSubmit }>
                    <Field 
                      onChange={e => { handleChange(e); this.updateUserMsg();}}
                      onBlur={e => { handleBlur(e); this.updateUserMsg();}}
                      placeholder="Sciper du professeur" name="sciper" type="text" component={ CustomInput } />
                    <ErrorMessage name="sciper" component={ CustomError } />

                    <div className="my-1 text-right">
                        <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                    </div>
                  </form>
                )}
            </Formik>
          </div>
        </Fragment>
      )
    }
    return content;
  }
}
export default withTracker(() => {
  Meteor.subscribe('professor.list');
  professors = Professors.find({}, {sort: {sciper: 1}}).fetch();
  return {
    professors: professors,
  };
})(Professor);