import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import React, { Component, Fragment } from "react";
import PopOver from "../popover/PopOver";
import { Formik, Field, ErrorMessage } from "formik";
import { Themes, Types } from "../../../api/collections";
import { CustomError, CustomInput } from "../CustomFields";
import { AlertSuccess, Loading, DangerMessage } from "../Messages";
import Swal from "sweetalert2";

const ThemesForm = (props) => (
  <div className="card-body">
    <Formik
      onSubmit={props.submitTheme}
      initialValues={{ name: "" }}
      validateOnBlur={false}
      validateOnChange={false}
    >
      {({ handleSubmit, isSubmitting, handleChange, handleBlur }) => (
        <form onSubmit={handleSubmit} className="">
          <Field
            onChange={(e) => {
              handleChange(e);
              props.updateUserMsg();
            }}
            onBlur={(e) => {
              handleBlur(e);
              props.updateUserMsg();
            }}
            placeholder="Nom du thème à ajouter"
            name="name"
            type="text"
            component={CustomInput}
            className=""
          />
          <ErrorMessage name="name" component={CustomError} />
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
);

const TypesList = (props) => (
  <Fragment>
    <h5 className="card-header">
      Liste des différents types de sites
      <PopOver
        popoverUniqID="type"
        title="Type du site"
        placement="bottom"
        description="Le type de site détermine son mode de déploiement et de stockage. Les sites internes, gérés par la DSI, sont de type kubernetes. Les sites publics ou externes utilisent le type external. Les sites archivés ou supprimés sont respectivement de type archived et deleted. Enfin, les sites temporaires, gérés par WP-Kleenex, sont de type temporary."
      />
    </h5>
    <ul className="list-group">
      {props.types.map((type) => (
        <li
          key={type._id}
          className="list-group-item d-flex justify-content-between align-items-center px-3"
        >
          <div className="d-flex align-items-center gap-2">
            <span className={`badge type-${type.name} p-2 text-uppercase text-small`}>
              {type.name}
            </span>
          </div>
          <span className="text-muted text-end">
            {type.description}
          </span>
        </li>
      ))}
    </ul>
  </Fragment>
);

const ThemesList = (props) => (
  <Fragment>
    <h5 className="card-header">
      Liste des thèmes des sites WordPress
      <PopOver
        popoverUniqID="themes"
        title="Thèmes WordPress"
        placement="bottom"
        description="Permet de définir quel thème installer sur le site. La majorité des sites utilisent le thème `wp-theme-2018`."
      />
    </h5>
    <ul className="list-group">
      {props.themes.map((theme, index) => (
        <li key={theme._id} value={theme.name} className="list-group-item">
          {theme.name}
          <button type="button" className="close" aria-label="Close">
            <span
              onClick={() => {
                props.handleClickOnDeleteThemeButton(theme._id);
              }}
              aria-hidden="true"
            >
              &times;
            </span>
          </button>
        </li>
      ))}
    </ul>
  </Fragment>
);

class Admin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      addSuccess: false,
      deleteSuccess: false,
      themeError: false,
      target: "",
    };
  }

  updateUserMsg = () => {
    this.setState({ addSuccess: false, deleteSuccess: false, target: "" });
  };

  submitTheme = (values, actions) => {
    Meteor.call("insertTheme", values, (errors, objectId) => {
      if (errors) {
        console.debug(errors);
        let formErrors = {};
        errors.details.forEach(function (error) {
          formErrors[error.name] = error.message;
        });
        actions.setErrors(formErrors);
        actions.setSubmitting(false);
      } else {
        actions.setSubmitting(false);
        actions.resetForm();
        this.setState({ addSuccess: true, target: "thème" });
      }
    });
  };

  handleClickOnDeleteThemeButton = (themeID) => {
    let element = Themes.findOne({ _id: themeID });
    let label;

    Swal.fire({
      title: `Voulez vous vraiment supprimer le thème: ${element.name}&nbsp;?`,
      text: "Cette action est irréversible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.value) {
        Meteor.call("removeTheme", { themeId: themeID }, (error, objectId) => {
          if (error) {
            this.setState({
              themeError: {
                themeID,
                details: error.details[0].message,
                title: error.name,
                additional: error.details[0].additional,
              },
            });
            console.log(`ERROR themes removeTheme ${error}`);
          } else {
            this.setState({ deleteSuccess: true, target: "thème" });
          }
        });
      }
    });
  };

  isLoading = () => {
    const isLoading =
      this.props.types === undefined ||
      this.props.themes === undefined;
    return isLoading;
  };

  render() {
    let content;
    if (this.isLoading()) {
      content = <Loading />;
    } else {
      content = (
        <Fragment>
          {this.state.addSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été ajouté avec succès&nbsp;!`}
            />
          ) : null}

          {this.state.deleteSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été supprimé avec succès&nbsp;!`}
            />
          ) : null}

          <div className="my-2">
            <TypesList
              types={this.props.types}
            />
          </div>

          <div className="card my-2">
            <ThemesList
              themes={this.props.themes}
              handleClickOnDeleteThemeButton={
                this.handleClickOnDeleteThemeButton
              }
            />
            <ThemesForm
              submitTheme={this.submitTheme}
              updateUserMsg={this.updateUserMsg}
            />
          </div>

          {this.state.addSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été ajouté avec succès&nbsp;!`}
            />
          ) : null}

          {this.state.deleteSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été supprimé avec succès&nbsp;!`}
            />
          ) : null}
        </Fragment>
      );
    }
    return content;
  }
}

export default withTracker(() => {
  Meteor.subscribe("theme.list");
  Meteor.subscribe("type.list");

  return {
    themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
    types: Types.find({}, { sort: { name: 1 } }).fetch(),
  };
})(Admin);
