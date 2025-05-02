import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { withRouter } from "react-router-dom";
import { Formik, Field, ErrorMessage } from "formik";
import { Sites, Types, Themes, Categories } from "../../../api/collections";
import {
  CustomSingleCheckbox,
  CustomCheckbox,
  CustomError,
  CustomInput,
  CustomSelect,
  CustomTextarea,
} from "../CustomFields";
import { Loading, AlertSiteSuccess, AlertSuccess, AlertDanger } from "../Messages";
import Select from "react-select";
import { generateSite } from "../../../api/methods/sites";
import PopOver from "../popover/PopOver";
import Swal from "sweetalert2";

class Add extends Component {
  constructor(props) {
    super(props);

    let action;
    if (this.props.match.path.startsWith("/edit")) {
      action = "edit";
    } else {
      action = "add";
    }

    this.state = {
      action: action,
      addSuccess: false,
      editSuccess: false,
      saveSuccess: false,
      generateSuccess: false,
      generateRunning: false,
    };
  }

  updateFields = (event, values) => {
    if (event.target.checked === false) {
      values.type = "";
      values.theme = "";
      values.unitId = "";
      values.languages = [];
      values.categories = [];
    } else {
      values.type = "kubernetes";
      values.theme = "wp-theme-2018";
    }
  };

  updateUserMsg = () => {
    this.setState({ addSuccess: false, editSuccess: false, generateSuccess: false });
  };

  updateSaveSuccess = (newValue) => {
    this.setState({ saveSuccess: newValue });
  };

  submit = async (values, actions) => {
    let methodName;
    let state;

    if (this.state.action === "add") {
      methodName = "insertSite";
      state = { addSuccess: true, editSuccess: false, action: "add" };
    } else if (this.state.action === "edit") {
      methodName = "updateSite";
      if (values.categories === null) {
        values.categories = [];
      }
      state = { addSuccess: false, editSuccess: true, action: "edit" };
    }

    if (values.type == "external") {
      delete values.tagline
      delete values.title
      delete values.categories
      delete values.theme
      delete values.languages
    }

    values.unitId = parseInt(values.unitId);

    try {
      const { url } = await Meteor.callAsync(methodName, values);

      const site = await Promise.race([
        new Promise(async (resolve, reject) => {
          const mySiteCursor = Sites.find({ url });
          async function tryAgain() {
            console.log(`Trying again... ${url}`);

            try {
              const exists = await mySiteCursor.fetchAsync();
              if (exists.length) resolve(exists[0]);
              return !!exists.length;
            } catch (e) {
              reject(e);
            }
          }

          try {
            if (!(await tryAgain())) {
              let waiting;
              waiting = await mySiteCursor.observeAsync({
                async added(site) {
                  if (await tryAgain()) {
                    if (waiting) waiting.stop();
                  }
                },
              });
            }
          } catch (e) {
            reject(e);
          }
        }),
        new Promise((resolve, reject) => {
          setInterval(() => reject("Timeout"), 10000);
        }),
      ]);

      actions.setSubmitting(false);
      if (this.state.action === "add") {
        state.previousSite = site;
        actions.resetForm();
      }
      this.setState(state);
      if (this.state.action === "add") {
        this.props.history.push("/edit/" + site._id);
      }
    } catch (error) {
      console.log(error);
      let formErrors = {};

      (error.details || []).forEach(function (error) {
        formErrors[error.name] = error.message;
      });

      actions.setErrors(formErrors);
      actions.setSubmitting(false);
    }
  };

  getInitialValues = () => {
    let initialValues;

    if (this.state.action == "add") {
      initialValues = {
        url: "",
        tagline: "",
        title: "",
        type: "kubernetes",
        theme: "wp-theme-2018",
        categories: [],
        languages: [],
        unitId: "",
        snowNumber: "",
        comment: "",
      };
    } else if (this.state.action == "edit") {
      initialValues = this.props.site;
    }
    return initialValues;
  };

  isLoading = (initialValues) => {
    const isLoading =
      this.props.themes === undefined ||
      this.props.categories === undefined ||
      initialValues === undefined;
    return isLoading;
  };

  getPageTitle = () => {
    let title;
    if (this.state.action === "edit") {
      title = "Modifier le site ci-dessous";
    } else {
      title = "Ajouter un nouveau site";
    }
    return title;
  };

  generate = async (siteId) => {
    try {
      const result = await generateSite({ siteId });
      this.setState({
        generateFailed: result !== "successful",
        generateSuccess: result === "successful",
        generateRunning: false,
      });
    } catch (error) {
      console.error("generateSite", error);
      this.setState({ generateFailed: true, generateSuccess: false, generateRunning: false });
    }
  };

  handleClickOnGenerateButton = (siteId) => {
    let site = Sites.findOne({ _id: siteId });

    Swal.fire({
      title: `Voulez vous vraiment normaliser le site ci-dessous ?`,
      text: `${site.url}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.value) {
        this.setState({ generateRunning: true });
        this.generate(siteId);
      }
    });
  };

  displayGenerateButton = (initialValues) => {
    // Display 'Normalize button' if
    // - user edit current site (no when user add a new site)
    // - the current site belongs to WordPress Infra
    return this.state.action === "edit" && initialValues.wpInfra;
  };

  render() {
    let content;
    let initialValues = this.getInitialValues();

    if (this.isLoading(initialValues)) {
      content = <Loading />;
    } else {
      let msgEditSuccess = (
        <div className="alert alert-success" role="alert">
          Le site a été modifié avec succès !
        </div>
      );

      content = (
        <div className="card my-2">
          <h5 className="card-header">{this.getPageTitle()}</h5>
          {this.state.addSuccess ? (
            <AlertSiteSuccess
              id={this.state.previousSite._id}
              title={this.state.previousSite.title}
            />
          ) : null}
          {this.state.generateRunning ? (
            <AlertSuccess message={"La normalisation du site a commencé !"} />
          ) : null}
          {this.state.generateSuccess ? (
            <AlertSuccess message={"Le site a été normalisé avec succès !"} />
          ) : null}
          {this.state.generateFailed ? (
            <AlertDanger message={"La normalisaton du site a échoué !"} />
          ) : null}
          {this.state.editSuccess && msgEditSuccess}
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
              touched,
              errors,
              setFieldValue,
              setFieldTouched,
            }) => (
              <form onSubmit={handleSubmit} className="bg-white border p-4">
                <div className="my-1 text-right">
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary mx-2">
                    Enregistrer
                  </button>
                  {this.displayGenerateButton(initialValues) ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary mx-1"
                        onClick={() => {
                          this.handleClickOnGenerateButton(initialValues._id);
                        }}
                      >
                        Normaliser le site
                      </button>
                      <PopOver
                        popoverUniqID="alignSite"
                        title="Normaliser le site"
                        placement="bottom"
                        description="Grâce à ce bouton, vous allez soit remettre le site en conformité, soit le créer (si ce dernier n'existe pas) "
                      />
                    </>
                  ) : null}
                </div>
                <Field
                  onChange={(e) => {
                    handleChange(e);
                    this.updateUserMsg();
                  }}
                  onBlur={(e) => {
                    handleBlur(e);
                    setFieldValue(event.target.name, event.target.value.trim());
                    this.updateUserMsg();
                  }}
                  placeholder="URL du site à ajouter"
                  label="URL"
                  name="url"
                  type="text"
                  component={CustomInput}
                />
                <ErrorMessage name="url" component={CustomError} />

                <Field
                  onChange={(e) => {
                    handleChange(e);
                    this.updateUserMsg();
                  }}
                  onBlur={(e) => {
                    handleBlur(e);
                    this.updateUserMsg();
                  }}
                  label="Type du site"
                  name="type"
                  component={CustomSelect}
                >
                  {this.props.types.map((type, index) => (
                    <option
                      key={type._id}
                      value={type.name}
                      label={type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                    >
                      {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="type" component={CustomError} />

                {values.type !== "external" && (
                  <div>
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        setFieldValue(event.target.name, event.target.value.trim());
                        this.updateUserMsg();
                      }}
                      placeholder="Tagline du site à ajouter"
                      label="Tagline"
                      name="tagline"
                      type="text"
                      component={CustomInput}
                    />
                    <ErrorMessage name="tagline" component={CustomError} />

                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        setFieldValue(event.target.name, event.target.value.trim());
                        this.updateUserMsg();
                      }}
                      placeholder="Titre du site à ajouter"
                      label="Titre"
                      name="title"
                      type="text"
                      component={CustomInput}
                    />
                    <ErrorMessage name="title" component={CustomError} />

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
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Thème"
                      name="theme"
                      component={CustomSelect}
                      disabled={values.wpInfra === false}
                    >
                      {values.wpInfra === false ? (
                        <option key="blank" value="blank" label=""></option>
                      ) : null}
                      {this.props.themes.map((theme, index) => (
                        <option key={theme._id} value={theme.name} label={theme.name}>
                          {theme.name}
                        </option>
                      ))}
                    </Field>

                    <ErrorMessage name="theme" component={CustomError} />

                    <h6>Langues</h6>
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Français"
                      name="languages"
                      type="checkbox"
                      value="fr"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Anglais"
                      name="languages"
                      type="checkbox"
                      value="en"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Allemand"
                      name="languages"
                      type="checkbox"
                      value="de"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Italien"
                      name="languages"
                      type="checkbox"
                      value="it"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Espagnol"
                      name="languages"
                      type="checkbox"
                      value="es"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Grec"
                      name="languages"
                      type="checkbox"
                      value="el"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <Field
                      onChange={(e) => {
                        handleChange(e);
                        this.updateUserMsg();
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        this.updateUserMsg();
                      }}
                      label="Roumain"
                      name="languages"
                      type="checkbox"
                      value="ro"
                      component={CustomCheckbox}
                      disabled={values.wpInfra === false}
                    />
                    <ErrorMessage name="languages" component={CustomError} />

                  </div>
                )}

                <Field
                  onChange={(e) => {
                    handleChange(e);
                    this.updateUserMsg();
                  }}
                  onBlur={(e) => {
                    handleBlur(e);
                    setFieldValue(event.target.name, event.target.value.trim());
                    this.updateUserMsg();
                  }}
                  placeholder="ID de l'unité du site à ajouter"
                  label="Unit ID"
                  name="unitId"
                  type="text"
                  component={CustomInput}
                  disabled={values.wpInfra === false}
                />
                <ErrorMessage name="unitId" component={CustomError} />

                <Field
                  onChange={(e) => {
                    handleChange(e);
                    this.updateUserMsg();
                  }}
                  onBlur={(e) => {
                    handleBlur(e);
                    setFieldValue(event.target.name, event.target.value.trim());
                    this.updateUserMsg();
                  }}
                  placeholder="N° du ticket du site à ajouter"
                  label="N°ticket SNOW"
                  name="snowNumber"
                  type="text"
                  component={CustomInput}
                />
                <ErrorMessage name="snowNumber" component={CustomError} />

                <Field
                  onChange={(e) => {
                    handleChange(e);
                    this.updateUserMsg();
                  }}
                  onBlur={(e) => {
                    handleBlur(e);
                    this.updateUserMsg();
                  }}
                  label="À monitorer"
                  name="monitorSite"
                  type="checkbox"
                  checked={values.monitorSite}
                  component={CustomSingleCheckbox}
                />

                <Field
                  onChange={(e) => {
                    handleChange(e);
                    this.updateUserMsg();
                  }}
                  onBlur={(e) => {
                    handleBlur(e);
                    this.updateUserMsg();
                  }}
                  label="Commentaire"
                  name="comment"
                  component={CustomTextarea}
                />
                <ErrorMessage name="comment" component={CustomError} />
                <div className="my-1 text-right">
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    Enregistrer
                  </button>
                </div>
                {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
              </form>
            )}
          </Formik>
          {this.state.addSuccess ? (
            <AlertSiteSuccess
              id={this.state.previousSite._id}
              title={this.state.previousSite.title}
            />
          ) : null}
          {this.state.editSuccess && msgEditSuccess}
        </div>
      );
    }
    return content;
  }
}
export default withRouter(
  withTracker((props) => {
    Meteor.subscribe("theme.list");
    Meteor.subscribe("category.list");
    Meteor.subscribe("type.list");
    Meteor.subscribe("sites.list");
    Meteor.subscribe("k8ssites.list");

    let sites;

    if (props.match.path === "/edit/*") {
      sites = Sites.find({ _id: props.match.params[0] }).fetch();
      return {
        types: Types.find({ schema: { $ne: null } }, { sort: { name: 1 } }).fetch(),
        themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
        categories: Categories.find({}, { sort: { name: 1 } }).fetch(),
        site: sites[0],
      };
    } else {
      return {
        types: Types.find({ schema: { $ne: null } }, { sort: { name: 1 } }).fetch(),
        themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
        categories: Categories.find({}, { sort: { name: 1 } }).fetch(),
      };
    }
  })(Add)
);

class MyCategorySelect extends React.Component {
  handleChange = (value) => {
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
            control: (styles) => ({
              ...styles,
              borderColor: this.props.error ? "red" : styles.borderColor,
            }),
          }}
          className="multiCategoriesSelect"
        />
        {!!this.props.error && (
          <div style={{ color: "red", marginTop: ".5rem" }}>{this.props.error}</div>
        )}
      </div>
    );

    return content;
  }
}
