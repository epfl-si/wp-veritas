import { withTracker } from "meteor/react-meteor-data";
import React from "react";
import Select from "react-select";
import { Formik } from "formik";
import { Tags, Sites } from "../../../api/collections";
import { associateTagsToSite } from "../../../api/methods/sites";
import { useParams } from "react-router";

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

  submit = async (values, actions) => {
    let tags = [
      ...(values.facultyTags || []),
      ...(values.instituteTags || []),
      ...(values.fieldOfResearchTags || []),
      ...(values.doctoralProgramTags || []),
    ];

    let site = this.getSite();
    try {
      await associateTagsToSite({ url: site.url, tags });
      this.setState({ saveSuccess: true });
    } catch (errors) {
      console.error(errors);
      if (!errors.details) throw errors;
      let formErrors = {};
      errors.details.forEach(function (error) {
        formErrors[error.name] = error.message;
      });
      actions.setErrors(formErrors);
    } finally {
      actions.setSubmitting(false);
    }
  };

  isLoading(site) {
    return (
      this.props.sites === undefined ||
      this.props.facultyTags === undefined ||
      this.props.instituteTags === undefined ||
      this.props.fieldOfResearchTags === undefined ||
      this.props.doctoralProgramTags === undefined ||
      site == undefined
    );
  }

  getSite = () => {
    return Sites.findOne({ url: this.props.siteUrl });
  };

  getTagsBySiteUrl = (siteUrl, tagList) => {
    return tagList.filter(tag => tag.sites && tag.sites.includes(siteUrl));
  };

  render() {
    let content;
    let site = this.getSite();
    const isLoading = this.isLoading(site);

    if (isLoading) {
      content = <h1>Loading....</h1>;
    } else {

      const siteUrl = site.url;

      const getTagsForSite = (tagList) =>
        tagList.filter(tag => tag.sites && tag.sites.includes(siteUrl));

      const facultyTagsForSite = getTagsForSite(this.props.facultyTags);
      const instituteTagsForSite = getTagsForSite(this.props.instituteTags);
      const fieldOfResearchTagsForSite = getTagsForSite(this.props.fieldOfResearchTags);
      const doctoralProgramTagsForSite = getTagsForSite(this.props.doctoralProgramTags);

      const msgSaveSuccess = (
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
            <a href={site.url} target="_blank" rel="noopener noreferrer">
              {site.url}
            </a>
            , veuillez sélectionner ci-dessous les tags à associer:{" "}
          </p>
          <Formik
            enableReinitialize={true}
            onSubmit={this.submit}
            initialValues={{
              facultyTags: facultyTagsForSite,
              instituteTags: instituteTagsForSite,
              fieldOfResearchTags: fieldOfResearchTagsForSite,
              doctoralProgramTags: doctoralProgramTagsForSite
            }}
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({
              handleSubmit,
              isSubmitting,
              values,
              touched,
              errors,
              setFieldValue,
              setFieldTouched,
            }) => (
              <form onSubmit={handleSubmit} className="bg-white border p-4">
                <div className="form-group clearfix">
                  <MySelect
                    name="facultyTags"
                    value={values.facultyTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    options={this.props.facultyTags}
                    error={errors.facultyTags}
                    touched={touched.facultyTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag faculté"
                  />
                  <MySelect
                    name="instituteTags"
                    value={values.instituteTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    options={this.props.instituteTags}
                    error={errors.instituteTags}
                    touched={touched.instituteTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag institut"
                  />
                  <MySelect
                    name="fieldOfResearchTags"
                    value={values.fieldOfResearchTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    options={this.props.fieldOfResearchTags}
                    error={errors.fieldOfResearchTags}
                    touched={touched.fieldOfResearchTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag domaine de recherche"
                  />
                  <MySelect
                    name="doctoralProgramTags"
                    value={values.doctoralProgramTags}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    options={this.props.doctoralProgramTags}
                    error={errors.doctoralProgramTags}
                    touched={touched.doctoralProgramTags}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un tag programme doctoral"
                  />
                </div>
                <div className="my-1 text-right">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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
  const { "*" : siteUrl } = useParams();
  Meteor.subscribe("tag.list");
  Meteor.subscribe("type.list");
  Meteor.subscribe("sites.list");
  Meteor.subscribe("k8ssites.list");

  const fetchSortedTags = (type) =>
    Tags.find({ type }, { sort: { name_fr: 1 } }).fetch();

  return {
    facultyTags: fetchSortedTags("faculty"),
    instituteTags: fetchSortedTags("institute"),
    fieldOfResearchTags: fetchSortedTags("field-of-research"),
    doctoralProgramTags: fetchSortedTags("doctoral-program"),
    sites: Sites.find().fetch(),
    siteUrl,
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
          value={this.props.value || []}
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
