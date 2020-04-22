import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import React, { Component, Fragment } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import { Categories, OpenshiftEnvs, Themes } from "../../../api/collections";
import { CustomError, CustomInput } from "../CustomFields";
import { AlertSuccess, Loading } from "../Messages";

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

const CategoriesForm = (props) => (
  <div className="card-body">
    <Formik
      onSubmit={props.submitCategory}
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
            placeholder="Nom de la catégorie à ajouter"
            name="name"
            type="text"
            component={CustomInput}
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

const OpenShiftEnvsForm = (props) => (
  <div className="card-body">
    <Formik
      onSubmit={props.submitOpenShiftEnv}
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
            placeholder="Nom de l'environnement openshift à ajouter"
            name="name"
            type="text"
            component={CustomInput}
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

const OpenshiftEnvsList = (props) => (
  <Fragment>
    <h5 className="card-header">Liste des environnements openshift</h5>
    <ul className="list-group">
      {props.openshiftenvs.map((env, index) => (
        <li key={env._id} value={env.name} className="list-group-item">
          {env.name}
          <button type="button" className="close" aria-label="Close">
            <span
              onClick={() => {
                if (
                  window.confirm("Are you sure you wish to delete this item?")
                )
                  props.deleteOpenshiftEnv(env._id);
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

const CategoriesList = (props) => (
  <Fragment>
    <h5 className="card-header">Liste des catégories des sites WordPress</h5>
    <ul className="list-group">
      {props.categories.map((category, index) => (
        <li
          key={category._id}
          value={category.name}
          className="list-group-item"
        >
          {category.name}
          <button type="button" className="close" aria-label="Close">
            <span
              onClick={() => {
                if (
                  window.confirm("Are you sure you wish to delete this item?")
                )
                  props.deleteCategory(category._id);
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

const ThemesList = (props) => (
  <Fragment>
    <h5 className="card-header">Liste des thèmes des sites WordPress</h5>
    <ul className="list-group">
      {props.themes.map((theme, index) => (
        <li key={theme._id} value={theme.name} className="list-group-item">
          {theme.name}
          <button type="button" className="close" aria-label="Close">
            <span
              onClick={() => {
                if (
                  window.confirm("Are you sure you wish to delete this item?")
                )
                  props.deleteTheme(theme._id);
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
      target: "",
    };
  }

  updateUserMsg = () => {
    this.setState({ addSuccess: false, deleteSuccess: false, target: "" });
  };

  submit = (collection, values, actions) => {
    let meteorMethodName;
    let target;

    if (collection._name === "openshiftenvs") {
      meteorMethodName = "insertOpenshiftEnv";
      target = "environnement openshift";
    } else if (collection._name === "themes") {
      meteorMethodName = "insertTheme";
      target = "thème";
    } else if (collection._name === "categories") {
      meteorMethodName = "insertCategory";
      target = "catégorie";
    }
    import { insertCategory } from "../../../api/methods/categories";
    insertCategory.call(values, (errors, objectId) => {
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
        this.setState({ addSuccess: true, target: target });
      }
    });
  };

  submitOpenShiftEnv = (values, actions) => {
    this.submit(OpenshiftEnvs, values, actions);
  };

  submitTheme = (values, actions) => {
    this.submit(Themes, values, actions);
  };

  submitCategory = (values, actions) => {
    this.submit(Categories, values, actions);
  };

  delete = (collection, elementId) => {
    let meteorMethodName;
    let target;
    let elementToDelete;

    if (collection._name === "openshiftenvs") {
      meteorMethodName = "removeOpenshiftEnv";
      target = "environnement openshift";
      elementToDelete = { 'openshiftEnvId': elementId };
    } else if (collection._name === "themes") {
      meteorMethodName = "removeTheme";
      target = "thème";
      elementToDelete = { 'themeId': elementId };
    } else if (collection._name === "categories") {
      meteorMethodName = "removeCategory";
      target = "catégorie";
      elementToDelete = { 'categoryId': elementId };
    }

    Meteor.call(meteorMethodName, elementToDelete, (error, objectId) => {
      if (error) {
        console.log(`ERROR ${collection._name} ${meteorMethodName} ${error}`);
      } else {
        this.setState({ deleteSuccess: true, target: target });
      }
    });
  };

  deleteOpenshiftEnv = (openshiftEnvID) => {
    this.delete(OpenshiftEnvs, openshiftEnvID);
  };

  deleteTheme = (themeID) => {
    this.delete(Themes, themeID);
  };

  deleteCategory = (categoryID) => {
    this.delete(Categories, categoryID);
  };

  isLoading = () => {
    const isLoading =
      this.props.openshiftenvs === undefined ||
      this.props.themes === undefined ||
      this.props.categories === undefined;
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
              message={`L'élément "${this.state.target}" a été ajouté avec succès !`}
            />
          ) : null}

          {this.state.deleteSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été supprimé avec succès !`}
            />
          ) : null}

          <div className="card my-2">
            <OpenshiftEnvsList
              openshiftenvs={this.props.openshiftenvs}
              deleteOpenshiftEnv={this.deleteOpenshiftEnv}
            />
            <OpenShiftEnvsForm
              submitOpenShiftEnv={this.submitOpenShiftEnv}
              updateUserMsg={this.updateUserMsg}
            />
          </div>

          <div className="card my-2">
            <CategoriesList
              categories={this.props.categories}
              deleteCategory={this.deleteCategory}
            />
            <CategoriesForm
              submitCategory={this.submitCategory}
              updateUserMsg={this.updateUserMsg}
            />
          </div>

          <div className="card my-2">
            <ThemesList
              themes={this.props.themes}
              deleteTheme={this.deleteTheme}
            />
            <ThemesForm
              submitTheme={this.submitTheme}
              updateUserMsg={this.updateUserMsg}
            />
          </div>

          {this.state.addSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été ajouté avec succès !`}
            />
          ) : null}

          {this.state.deleteSuccess ? (
            <AlertSuccess
              message={`L'élément "${this.state.target}" a été supprimé avec succès !`}
            />
          ) : null}
        </Fragment>
      );
    }
    return content;
  }
}

export default withTracker(() => {
  Meteor.subscribe("openshiftEnv.list");
  Meteor.subscribe("theme.list");
  Meteor.subscribe("category.list");

  return {
    openshiftenvs: OpenshiftEnvs.find({}, { sort: { name: 1 } }).fetch(),
    themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
    categories: Categories.find({}, { sort: { name: 1 } }).fetch(),
  };
})(Admin);
