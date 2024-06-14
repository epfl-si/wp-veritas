import Swal from "sweetalert2";
import { withTracker } from "meteor/react-meteor-data";
import React, { Component, Fragment } from "react";
import { Tags } from "../../../api/collections";
import { Formik, Field, ErrorMessage } from "formik";
import { CustomError, CustomInput, CustomSelect } from "../CustomFields";
import { Link } from "react-router-dom";
import { Loading } from "../Messages";
import { insertTag, updateTag, removeTag } from "../../../api/methods/tags";
import PopOver from "../popover/PopOver";

class Tag extends Component {
  constructor(props) {
    super(props);

    let action;
    if (this.props.match.path.startsWith("/tag/")) {
      action = "edit";
    } else {
      action = "add";
    }

    this.state = {
      hideUrlsField: false,
      saveSuccess: false,
      action: action,
    };
  }

  submit = async (values, actions) => {
    if (values.type == "field-of-research") {
      let firstPartUrl =
        "https://www.epfl.ch/research/domains/cluster?field-of-research=";
      let nameFr = escape(values.name_fr);
      let nameEn = escape(values.name_en);
      values.url_fr = `${firstPartUrl}${nameFr}`;
      values.url_en = `${firstPartUrl}${nameEn}`;
    }
    if (this.state.action === "add") {
      try {
        await insertTag(values);
        actions.resetForm();
        this.setState({ saveSuccess: true });
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
    } else if (this.state.action === "edit") {
      try {
        await updateTag(values);
        this.props.history.push("/tags");
        this.setState({ saveSuccess: true });
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
    }
  };

  deleteTag(tagId) {
    removeTag({ tagId }, function (error, tagId) {
      if (error) {
        console.log(`ERROR deleteTag ${error}`);
      }
    });
  }

  handleClickOnDeleteButton = (tagId) => {
    let tag = Tags.findOne({ _id: tagId });

    Swal.fire({
      title: `Voulez vous vraiment supprimer le tag: ${tag.nameFr} ?`,
      text: "Cette action est irréversible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.value) {
        this.deleteTag(tagId);
      }
    });
  };

  updateSaveSuccess = () => {
    this.setState({ saveSuccess: false });
  };

  hideUrls = (e) => {
    if (e.target.value == "field-of-research") {
      this.setState({ hideUrlsField: true });
    } else {
      this.setState({ hideUrlsField: false });
    }
  };

  getTag = () => {
    // Get the URL parameter
    let tagId = this.props.match.params._id;
    let tag = Tags.findOne({ _id: tagId });
    return tag;
  };

  getPageTitle = () => {
    let title;
    if (this.state.action === "edit") {
      title = "Modifier le tag ci-dessous";
    } else {
      title = "Ajouter un nouveau tag";
    }
    return title;
  };

  getInitialValues = () => {
    let initialValues;

    if (this.state.action == "add") {
      initialValues = {
        name_fr: "",
        name_en: "",
        url_fr: "",
        url_en: "",
        type: "faculty",
      };
    } else if (this.state.action == "edit") {
      initialValues = this.getTag();
    }
    return initialValues;
  };

  isLoading(initialValues) {
    return this.props.tags === undefined || initialValues === undefined;
  }

  render() {
    let content;
    let initialValues = this.getInitialValues();

    if (this.isLoading(initialValues)) {
      return <Loading />;
    } else {
      let edit = this.state.action == "edit";

      let msgSaveSuccess = (
        <div className="alert alert-success" role="alert">
          La modification a été enregistrée avec succès !
        </div>
      );

      content = (
        <Fragment>
          <div className="card my-2">
            <h5 className="card-header">
              {this.getPageTitle()}
              <PopOver
                popoverUniqID="tags"
                title="Tags wp-veritas"
                placement="bottom"
                description="Les tags permettent de regrouper plusieurs sites. Les tags sont séparés en 3 types : 
                             Faculté, Institut et Domaine de recherche. Les tags sont visibles dans le `breadcrumb` des sites,
                             par exemple sur https://www.epfl.ch/research/domains/bioengineering/."
              />
            </h5>
            {this.state.saveSuccess && msgSaveSuccess}
            <Formik
              onSubmit={this.submit}
              initialValues={initialValues}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({
                handleSubmit,
                handleChange,
                handleBlur,
                isSubmitting,
                values,
              }) => (
                <form onSubmit={handleSubmit} className="bg-white border p-4">
                  <Field
                    onChange={(e) => {
                      handleChange(e);
                      this.updateSaveSuccess();
                    }}
                    onBlur={(e) => {
                      handleBlur(e);
                      this.updateSaveSuccess();
                    }}
                    placeholder="Nom du tag en français"
                    label="Nom [FR]"
                    name="name_fr"
                    type="text"
                    component={CustomInput}
                  />
                  <ErrorMessage name="name_fr" component={CustomError} />

                  <Field
                    onChange={(e) => {
                      handleChange(e);
                      this.updateSaveSuccess();
                    }}
                    onBlur={(e) => {
                      handleBlur(e);
                      this.updateSaveSuccess();
                    }}
                    placeholder="Nom du tag en anglais"
                    label="Nom [EN]"
                    name="name_en"
                    type="text"
                    component={CustomInput}
                  />
                  <ErrorMessage name="name_en" component={CustomError} />

                  <Field
                    onChange={(e) => {
                      handleChange(e);
                      this.hideUrls(e);
                      this.updateSaveSuccess();
                    }}
                    onBlur={(e) => {
                      handleBlur(e);
                      this.updateSaveSuccess();
                    }}
                    label="Type"
                    name="type"
                    component={CustomSelect}
                  >
                    <option value="faculty">Faculté</option>
                    <option value="institute">Institut</option>
                    <option value="field-of-research">
                      Domaine de recherche
                    </option>
                  </Field>
                  <ErrorMessage name="type" component={CustomError} />

                  {this.state.hideUrlsField ? (
                    ""
                  ) : (
                    <Fragment>
                      <Field
                        onChange={(e) => {
                          handleChange(e);
                          this.updateSaveSuccess();
                        }}
                        onBlur={(e) => {
                          handleBlur(e);
                          this.updateSaveSuccess();
                        }}
                        placeholder="URL du tag en français"
                        label="URL [FR]"
                        name="url_fr"
                        type="text"
                        component={CustomInput}
                      />
                      <ErrorMessage name="url_fr" component={CustomError} />

                      <Field
                        onChange={(e) => {
                          handleChange(e);
                          this.updateSaveSuccess();
                        }}
                        onBlur={(e) => {
                          handleBlur(e);
                          this.updateSaveSuccess();
                        }}
                        placeholder="URL du tag en anglais"
                        label="URL [EN]"
                        name="url_en"
                        type="text"
                        component={CustomInput}
                      />
                      <ErrorMessage name="url_en" component={CustomError} />
                    </Fragment>
                  )}

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
          {edit ? (
            ""
          ) : (
            <div className="card my-2">
              <h5 className="card-header">Liste des tags</h5>
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-5" scope="col">
                      #
                    </th>
                    <th scope="col">Nom FR</th>
                    <th scope="col">Nom EN</th>
                    <th scope="col">URL FR</th>
                    <th scope="col">URL EN</th>
                    <th scope="col">Type</th>
                    <th className="w-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.props.tags.map((tag, index) => (
                    <tr key={tag._id}>
                      <td scope="row">{index + 1}</td>
                      <td>{tag.name_fr}</td>
                      <td>{tag.name_en}</td>
                      <td className="special">
                        <a href={tag.url_fr} target="_blank">
                          {tag.url_fr}
                        </a>
                      </td>
                      <td className="special">
                        <a href={tag.url_en} target="_blank">
                          {tag.url_en}
                        </a>
                      </td>
                      <td>{tag.type}</td>
                      <td>
                        <Link className="mr-2" to={`/tag/${tag._id}`}>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                          >
                            Éditer
                          </button>
                        </Link>
                        <button
                          type="button"
                          className="close"
                          aria-label="Close"
                        >
                          <span
                            onClick={() => {
                              this.handleClickOnDeleteButton(tag._id);
                            }}
                            aria-hidden="true"
                          >
                            &times;
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Fragment>
      );
    }
    return content;
  }
}
export default withTracker(() => {
  Meteor.subscribe("tag.list");
  return {
    tags: Tags.find({}, { sort: { name_fr: 1 } }).fetch(),
  };
})(Tag);
