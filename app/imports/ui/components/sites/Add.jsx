import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { Formik, Field, ErrorMessage } from "formik";
import { Sites, Types, Themes } from "../../../api/collections";
import { OptionalCategories } from "../../../api/k8s/siteCategories";
import {
  CustomSingleCheckbox,
  CustomCheckbox,
  CustomError,
  CustomInput,
  CustomSelect,
  CustomTextarea,
} from "../CustomFields";
import { Loading, AlertSiteSuccess, AlertSuccess, AlertDanger, AlertInfo, AlertWarning } from "../Messages";
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
      alertMessage: null,
      alertType: null,
    };
  }

  // Return the actual schema of a Site.Type, "internal", "external"
  getSchemaFromType = (type) => {
    let myType = Types.find({name: type}).fetch();
    if (Object.keys(myType).length) {
      return myType[0].schema;
    }
    return null;
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
    this.setState({ addSuccess: false, editSuccess: false, generateSuccess: false, alertMessage: null, alertType: null });
  };

  updateSaveSuccess = (newValue) => {
    this.setState({ saveSuccess: newValue });
  };

  setAlert = (type, message) => {
    this.setState({
      alertType: type,
      alertMessage: message
    });
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

    if (this.getSchemaFromType(values.type) == "external") {
      delete values.tagline
      delete values.title
      delete values.categories
      delete values.theme
      delete values.languages
    }

    values.unitId = parseInt(values.unitId);

    try {
      this.setAlert("warning", "En cours de traitement...");
      const { url, statusCode, message } = await Meteor.callAsync(methodName, values);
      
      if (statusCode >= 200 && statusCode < 300) {
        let site;
        try {
          site = await Promise.race([
            new Promise(async (resolve, reject) => {
              const mySiteCursor = Sites.find({ url });
              
              async function tryAgain() {
                console.log(`Trying again... ${url}`);
                try {
                  const exists = await mySiteCursor.fetchAsync();
                  if (exists.length) {
                    resolve(exists[0]);
                    return true;
                  }
                  return false;
                } catch (e) {
                  reject(e);
                  return false;
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
              setTimeout(() => {
                reject("Timeout");
              }, 10000);
            }),
          ]);
          
          console.log("Site created", statusCode);
        } catch (timeoutError) {
          console.warn("Site creation timed out, but statusCode was successful:", timeoutError);
        }
        
        state.alertType = "success";
        state.alertMessage = message || (this.state.action === "add" ?
          "Le site a été créé avec succès !" :
          "Le site a été modifié avec succès !");
        
        actions.setSubmitting(false);
        if (this.state.action === "add") {
          state.previousSite = site || { url };
          actions.resetForm();
        }
        this.setState(state);
      } else {
        this.setAlert("danger", message || "Une erreur est survenue lors de l'opération.");
        actions.setSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      if (error.error == "validation-error") {
        let formErrors = {};

        (error.details || []).forEach(function (error) {
          formErrors[error.name] = error.message;
        });

        this.setState({
          alertType: null,
          alertMessage: null
        });

        actions.setErrors(formErrors);
      } else {
        this.setAlert(
          "danger",
          "Erreur lors de la création: " +
            (error?.details?.message ?? error?.message ?? "Une erreur inattendue est survenue.")
        );
      }
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

  renderAlert() {
    if (this.state.addSuccess) {
      return <AlertSiteSuccess id={this.state.previousSite._id} title={this.state.previousSite.title} />;
    }
    
    if (this.state.alertType && this.state.alertMessage) {
      switch (this.state.alertType) {
        case "success":
          return <AlertSuccess message={this.state.alertMessage} />;
        case "danger":
          return <AlertDanger message={this.state.alertMessage} />;
        case "warning":
          return <AlertWarning message={this.state.alertMessage} />;
        case "info":
          return <AlertInfo message={this.state.alertMessage} />;
        default:
          return null;
      }
    }

    return null;
  }

  render() {
    let content;
    let initialValues = this.getInitialValues();

    if (this.isLoading(initialValues)) {
      content = <Loading />;
    } else {
      content = (
        <div className="card my-2">
          <h5 className="card-header">{this.getPageTitle()}</h5>
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
                {this.renderAlert()}
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

                {this.getSchemaFromType(values.type) !== "external" && (
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
                      placeholder="Titre du site à ajouter"
                      label="Titre"
                      name="title"
                      type="text"
                      component={CustomInput}
                    />
                    <ErrorMessage name="title" component={CustomError} />

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
        </div>
      );
    }
    return content;
  }
}
export default withTracker((props) => {
    Meteor.subscribe("theme.list");
    Meteor.subscribe("type.list");
    Meteor.subscribe("sites.list");
    Meteor.subscribe("k8ssites.list");

    let sites;

    if (props.match.path === "/edit/*") {
      sites = Sites.find({ _id: props.match.params[0] }).fetch();
      return {
        types: Types.find({ schema: { $ne: null } }, { sort: { name: 1 } }).fetch(),
        themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
        categories: OptionalCategories.map((c) => c.label),
        site: sites[0],
      };
    } else {
      return {
        types: Types.find({ schema: { $ne: null } }, { sort: { name: 1 } }).fetch(),
        themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
        categories: OptionalCategories.map((c) => c.label),
      };
    }
  })(Add);

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
          getOptionLabel={(option) => option}
          getOptionValue={(option) => option}
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
