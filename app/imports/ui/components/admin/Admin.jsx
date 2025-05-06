import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import React, { Component, Fragment } from "react";
import PopOver from "../popover/PopOver";
import { Formik, Field, ErrorMessage } from "formik";
import { Categories, Themes, Types } from "../../../api/collections";
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

class CategoriesList extends Component {
  render() {
    let haveError = this.props.categoriesError;
    return (
      <Fragment>
        <h5 className="card-header">
          Liste des catégories des sites WordPress
          <PopOver
            popoverUniqID="categories"
            title="Catégories"
            placement="bottom"
            description="Les catégories permettent de définir quelles spécificités les sites
                     doivent avoir lors de leurs déploiements. Par exemple, la catégorie `inside`
                     permet d'installer le nécessaire permettant l'authentification d'accès
                     au site. De manière similaire, la catégorie `Restauration` permet
                     l'installation du plugin `epfl-menu` lors du déploiement du site."
          />
        </h5>
        <ul className="list-group">
          {this.props.categories.map((category, index) => (
            <li
              key={category._id}
              value={category.name}
              className="list-group-item"
            >
              <div className="ListEntry">
                {category.name}
                <button type="button" className="close" aria-label="Close">
                  <span
                    onClick={() => {
                      this.props.handleClickOnDeleteCategoryButton(
                        category._id
                      );
                    }}
                    aria-hidden="true"
                  >
                    &times;
                  </span>
                </button>

                {haveError.elementId === category._id && (
                  <DangerMessage
                    elementId={"category-" + category._id}
                    title={haveError.title}
                    message={haveError.details}
                    additional={haveError.additional}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </Fragment>
    );
  }
}

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
      categoryError: false,
      target: "",
    };
  }

  updateUserMsg = () => {
    this.setState({ addSuccess: false, deleteSuccess: false, target: "" });
  };

  submit = (collection, values, actions) => {
    let meteorMethodName;
    let target;

    if (collection._name === "themes") {
      meteorMethodName = "insertTheme";
      target = "thème";
    } else if (collection._name === "categories") {
      meteorMethodName = "insertCategory";
      target = "catégorie";
    }

    Meteor.call(meteorMethodName, values, (errors, objectId) => {
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

    if (collection._name === "themes") {
      meteorMethodName = "removeTheme";
      target = "thème";
      elementToDelete = { themeId: elementId };
    } else if (collection._name === "categories") {
      meteorMethodName = "removeCategory";
      target = "catégorie";
      elementToDelete = { categoryId: elementId };
    }

    Meteor.call(meteorMethodName, elementToDelete, (error, objectId) => {
      if (error) {
        this.setState({
          categoryError: {
            elementId,
            details: error.details[0].message,
            title: error.name,
            additional: error.details[0].additional,
          },
        });
        console.log(`ERROR ${collection._name} ${meteorMethodName} ${error}`);
      } else {
        this.setState({ deleteSuccess: true, target: target });
      }
    });
  };

  deleteTheme = (themeID) => {
    this.delete(Themes, themeID);
  };

  handleClickOnDeleteThemeButton = (themeID) => {
    this.handleClickOnDeleteButton(Themes, themeID);
  };

  deleteCategory = (categoryID) => {
    this.delete(Categories, categoryID);
  };

  handleClickOnDeleteCategoryButton = (categoryID) => {
    this.handleClickOnDeleteButton(Categories, categoryID);
  };

  handleClickOnDeleteButton = (collection, elementId) => {
    let element = collection.findOne({ _id: elementId });
    let label;

    if (collection._name === "themes") {
      label = "le thème";
    } else if (collection._name === "platformtargets") {
      label = "la plateforme cible";
    } else if (collection._name === "categories") {
      label = "la catégorie";
    }

    Swal.fire({
      title: `Voulez vous vraiment supprimer ${label}: ${element.name} ?`,
      text: "Cette action est irréversible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.value) {
        if (collection._name === "themes") {
          this.deleteTheme(elementId);
        } else if (collection._name === "categories") {
          this.deleteCategory(elementId);
        }
      }
    });
  };

  isLoading = () => {
    const isLoading =
      this.props.types === undefined ||
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

          <div className="my-2">
            <TypesList
              types={this.props.types}
            />
          </div>

          <div className="card my-2">
            <CategoriesList
              categoriesError={this.state.categoryError}
              categories={this.props.categories}
              handleClickOnDeleteCategoryButton={
                this.handleClickOnDeleteCategoryButton
              }
            />
            <CategoriesForm
              submitCategory={this.submitCategory}
              updateUserMsg={this.updateUserMsg}
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
  Meteor.subscribe("theme.list");
  Meteor.subscribe("category.list");
  Meteor.subscribe("type.list");

  return {
    themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
    categories: Categories.find({}, { sort: { name: 1 } }).fetch(),
    types: Types.find({}, { sort: { name: 1 } }).fetch(),
  };
})(Admin);
