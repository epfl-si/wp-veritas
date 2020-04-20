import { withTracker } from "meteor/react-meteor-data";
import React, { Component } from "react";
import Select from "react-select";
import { Formik } from "formik";
import { Professors, Sites } from "../../../api/collections";
import { Loading } from "../Messages";
import { associateProfessorsToSite } from "../../../api/methods/sites";

class SiteProfessors extends Component {
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
    let professors = values.professors;
    let site = this.getSite();
    console.log(professors);
    associateProfessorsToSite.call({ site, professors }, (errors, siteId) => {
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
    });
  };

  isLoading(site) {
    return (
      this.props.sites === undefined ||
      this.props.professors === undefined ||
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
      content = <Loading />;
    } else {
      let msgSaveSuccess = (
        <div className="alert alert-success" role="alert">
          La modification a été enregistrée avec succès !
        </div>
      );

      content = (
        <div className="my-4">
          <h4>Associer des professeurs à un site WordPress</h4>
          {this.state.saveSuccess && msgSaveSuccess}
          <p>
            Pour le site{" "}
            <a href={site.url} target="_blank">
              {site.url}
            </a>
            , veuillez sélectionner ci-dessous les professeurs à associer:{" "}
          </p>
          <Formik
            onSubmit={this.submit}
            initialValues={{ professors: site.professors }}
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
                    id="professors"
                    value={values.professors}
                    onChange={setFieldValue}
                    onBlur={setFieldTouched}
                    error={errors.professors}
                    touched={touched.professors}
                    options={this.props.professors}
                    saveSuccess={this.updateSaveSuccess}
                    placeholder="Sélectionner un professeur"
                    name="professors"
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
  Meteor.subscribe("professor.list");
  Meteor.subscribe("sites.list");

  return {
    professors: Professors.find({}, { sort: { sciper: 1 } }).fetch(),
    sites: Sites.find({}).fetch(),
  };
})(SiteProfessors);

class MySelect extends React.Component {
  handleChange = (value) => {
    // this is going to call setFieldValue and manually update values
    this.props.onChange(this.props.name, value);
    this.props.saveSuccess(!this.props.saveSuccess);
  };

  handleBlur = () => {
    // this is going to call setFieldTouched and manually update touched
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
          getOptionLabel={(option) => option.sciper + " " + option.displayName}
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
