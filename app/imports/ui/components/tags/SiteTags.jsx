import { withTracker } from "meteor/react-meteor-data";
import React from "react";
import Select from "react-select";
import { Formik } from "formik";
import { Tags, Sites } from "../../../api/collections";
import { associateTagsToSite } from "../../../api/methods/sites";

class SiteTags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      saveSuccess: false,
    };
  }

  updateSaveSuccess = (newValue) => {
    this.setState({ saveSuccess: newValue });
  };

  submit = (values, actions) => {
    let tags = [
      ...(values.facultyTags || []),
      ...(values.instituteTags || []),
      ...(values.fieldOfResearchTags || []),
    ];

    let site = this.getSite();
    associateTagsToSite(
      {
        site,
        tags,
      },
      (errors, siteId) => {
        if (errors) {
          let formErrors = {};
          errors.details.forEach(function (error) {
            formErrors[error.name] = error.message;
          });
          actions.setErrors(formErrors);
          actions.setSubmitting(false);
        } else {
          actions.setSubmitting(false);
          this.setState({ saveSuccess: true });
        }
      }
    );
  };

  isLoading(site) {
    return (
      this.props.sites === undefined ||
      this.props.facultyTags === undefined ||
      this.props.instituteTags === undefined ||
      this.props.fieldOfResearchTags === undefined ||
      site == undefined
    );
  }

  getSite = () => {
    // Get the URL parameter
    let siteId = this.props.match.params._id;
    let site = Sites.findOne({ _id: siteId });
    return site;
  };

  render() {
    let content;
    let site = this.getSite();
    const isLoading = this.isLoading(site);

    if (isLoading) {
      content = <h1>Loading....</h1>;
    } else {
      let msgSaveSuccess = (
        <div className="alert alert-success" role="alert">
          La modification a été enregistrée avec succès !
        </div>
      );

      content = (
        <div className="my-4">
          <h4>Associer des tags à un site WordPress</h4>
          {this.state.saveSuccess && msgSaveSuccess}
          <p>
            Pour le site{" "}
            <a href={site.url} target="_blank">
              {site.url}
            </a>
            , veuillez sélectionner ci-dessous les tags à associer:{" "}
          </p>
          <Formik
            onSubmit={this.submit}
            initialValues={{
              facultyTags: site.tags.filter((tag) => tag.type === "faculty"),
              instituteTags: site.tags.filter(
                (tag) => tag.type === "institute"
              ),
              fieldOfResearchTags: site.tags.filter(
                (tag) => tag.type === "field-of-research"
              ),
            }}
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({
              handleSubmit,
              isSubmitting,
              values,
              touched,
              dirty,
              errors,
              handleChange,
              handleBlur,
              handleReset,
              setFieldValue,
              setFieldTouched,
            }) => (
              <form onSubmit={handleSubmit} className="bg-white border p-4">
                <div className="form-group clearfix">
                  <MySelect
                    id="facultyTags"
                    value={values.facultyTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    error={errors.facultyTags}
                    touched={touched.facultyTags}
                    options={this.props.facultyTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag faculté"
                    name="facultyTags"
                  />
                  <MySelect
                    value={values.instituteTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    error={errors.instituteTags}
                    touched={touched.instituteTags}
                    options={this.props.instituteTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag institut"
                    name="instituteTags"
                  />
                  <MySelect
                    value={values.fieldOfResearchTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    error={errors.fieldOfResearchTags}
                    touched={touched.fieldOfResearchTags}
                    options={this.props.fieldOfResearchTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag domaine de recherche"
                    name="fieldOfResearchTags"
                  />
                </div>
                <div className="my-1 text-right ">
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </Formik>
        </div>
      );
    }
    return content;
  }
}
export default withTracker(() => {
  Meteor.subscribe("tag.list");
  Meteor.subscribe("sites.list");

  let facultyTags = Tags.find(
    { type: "faculty" },
    { sort: { name_fr: 1 } }
  ).fetch();

  let instituteTags = Tags.find(
    { type: "institute" },
    { sort: { name_fr: 1 } }
  ).fetch();

  let fieldOfResearchTags = Tags.find(
    { type: "field-of-research" },
    { sort: { name_fr: 1 } }
  ).fetch();

  return {
    facultyTags: facultyTags,
    instituteTags: instituteTags,
    fieldOfResearchTags: fieldOfResearchTags,
    sites: Sites.find({ isDeleted: false }).fetch(),
  };
})(SiteTags);

class MySelect extends React.Component {
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
      <div style={{ margin: "1rem 0" }}>
        <Select
          isMulti
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          value={this.props.value}
          options={this.props.options}
          getOptionLabel={(option) => option.name_fr}
          getOptionValue={(option) => option._id}
          placeholder={this.props.placeholder}
        />
        {!!this.props.error && this.props.touched && (
          <div style={{ color: "red", marginTop: ".5rem" }}>
            {this.props.error}
          </div>
        )}
      </div>
    );

    return content;
  }
}
