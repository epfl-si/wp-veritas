import Swal from "sweetalert2";
import React, { Component, Fragment } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { Formik, Field, ErrorMessage } from "formik";
import { Professors } from "../../../api/collections";
import { CustomError, CustomInput } from "../CustomFields";
import { AlertSuccess, Loading } from "../Messages";
import {
  insertProfessor,
  removeProfessor,
} from "../../../api/methods/professors";
import PopOver from "../popover/PopOver";

class ProfessorsList extends Component {
  render() {
    return (
      <div className="card my-2">
        <h5 className="card-header">Liste des professeurs</h5>
        <ul className="list-group">
          {this.props.professors.map((professor, index) => (
            <li
              id={"sciper-" + professor.sciper}
              key={professor._id}
              className="list-group-item"
            >
              {professor.sciper}&nbsp;
              {professor.displayName}
              <button type="button" className="close" aria-label="Close">
                <span
                  onClick={() => {
                    this.props.handleClickOnDeleteButton(professor._id);
                  }}
                  aria-hidden="true"
                >
                  &times;
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

class Professor extends Component {
  constructor(props) {
    super(props);

    let action;
    if (this.props.match.path == "/professor/:_id/edit") {
      action = "edit";
    } else {
      action = "add";
    }

    this.state = {
      action: action,
      addSuccess: false,
      editSuccess: false,
      deleteSuccess: false,
    };
  }

  deleteProfessor = (professorId) => {
    removeProfessor({ professorId }, (error, professorID) => {
      if (error) {
        console.log(`ERROR Professor removeProfessor ${error}`);
      } else {
        this.setState({ deleteSuccess: true });
      }
    });
  };

  handleClickOnDeleteButton = (professorId) => {
    let professor = Professors.findOne({ _id: professorId });

    Swal.fire({
      title: `Voulez vous vraiment supprimer le professeur: ${professor.displayName} ?`,
      text: "Cette action est irréversible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.value) {
        this.deleteProfessor(professorId);
      }
    });
  };

  updateUserMsg = () => {
    this.setState({
      addSuccess: false,
      editSuccess: false,
      deleteSuccess: false,
    });
  };

  submitProfessor = async (values, actions) => {
    const getUserFromLDAPPromise = (method, values) => {
      return new Promise((resolve, reject) => {
        Meteor.call(method, values, (error, result) => {
          if (error) {
            console.log(`ERROR ${error}`);
          } else {
            resolve(result);
          }
        });
      });
    };
    const insertProfessorPromise = async (values) => {
      try {
        await insertProfessor(values);
        actions.resetForm();
        this.setState({
          addSuccess: true,
          editSuccess: false,
          deleteSuccess: false,
          action: "add",
        });
      } catch (errors) {
        if (! errors.details) throw errors;
        console.error(errors);
        let formErrors = {};
        errors.details.forEach(function (error) {
          formErrors[error.name] = error.message;
        });
        actions.setErrors(formErrors);
      } finally {
        actions.setSubmitting(false);
      }
    };
    const ldapInfo = await getUserFromLDAPPromise(
      "getUserFromLDAP",
      values.sciper
    );
    let infos = {
      sciper: ldapInfo.sciper,
      displayName: ldapInfo.displayName,
    };
    await insertProfessorPromise(infos);
  };

  getProfessor = () => {
    // Get the URL parameter
    let professorId = this.props.match.params._id;
    let professor = Professors.findOne({ _id: professorId });
    return professor;
  };

  getInitialValues = () => {
    let initialValues;
    if (this.state.action == "add") {
      initialValues = { sciper: "" };
    } else {
      initialValues = this.getProfessor();
    }
    return initialValues;
  };

  render() {
    let content;
    let initialValues = this.getInitialValues();
    let isLoading =
      this.props.professors == undefined || initialValues == undefined;

    if (isLoading) {
      content = <Loading />;
    } else {
      content = (
        <Fragment>
          <div className="card">
            <h5 className="card-header">
              Ajouter un professeur
              <PopOver
                popoverUniqID="professors"
                title="Professeurs"
                placement="bottom"
                description="Les sites de l'EPFL peuvent être liés à un ou plusieurs Professeurs."
              />
            </h5>
            {this.state.addSuccess ? (
              <AlertSuccess
                message={"Le nouveau professeur a été ajouté avec succès !"}
              />
            ) : null}
            {this.state.deleteSuccess ? (
              <AlertSuccess
                message={"Le professeur a été supprimé avec succès !"}
              />
            ) : null}
            <Formik
              onSubmit={this.submitProfessor}
              initialValues={initialValues}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({ handleSubmit, isSubmitting, handleChange, handleBlur }) => (
                <form onSubmit={handleSubmit}>
                  <Field
                    onChange={(e) => {
                      handleChange(e);
                      this.updateUserMsg();
                    }}
                    onBlur={(e) => {
                      handleBlur(e);
                      this.updateUserMsg();
                    }}
                    placeholder="Sciper du professeur"
                    name="sciper"
                    type="text"
                    component={CustomInput}
                  />
                  <ErrorMessage name="sciper" component={CustomError} />

                  <div className="my-1 text-right">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>

          {this.state.deleteSuccess ? (
            <AlertSuccess
              message={"Le professeur a été supprimé avec succès !"}
            />
          ) : null}

          <ProfessorsList
            professors={this.props.professors}
            callBackDeleteProfessor={this.deleteProfessor}
            handleClickOnDeleteButton={this.handleClickOnDeleteButton}
          />
        </Fragment>
      );
    }
    return content;
  }
}
export default withTracker(() => {
  Meteor.subscribe("professor.list");
  return {
    professors: Professors.find({}, { sort: { displayName: 1 } }).fetch(),
  };
})(Professor);
