import React, { Component } from 'react';
import Select from 'react-select';
import { Formik } from 'formik';
import { Professors, Sites } from '../../../api/collections';
import { Loading } from '../Messages';

export default class SiteProfessors extends Component {

  constructor(props) {
    super(props);
    this.state = {
      saveSuccess: false,
      professors: [],
      site: '',
    }
  }

  updateSaveSuccess = (newValue) => {
    this.setState({ saveSuccess: newValue });
  }
    
  componentWillMount() {
    let siteId = this.props.match.params._id;
    Meteor.subscribe('site.single', siteId);
    Meteor.subscribe('professor.list');

    Tracker.autorun(() => {
      let site = Sites.findOne({_id: this.props.match.params._id});
      let professors = Professors.find({}).fetch();
      this.setState({
        professors: professors, 
        site: site,
      });
    })
  }

  submit = (values, actions) => {    
    let professors = values.professors;
    Meteor.call(
      'associateProfessorsToSite',
      this.state.site,
      professors, 
      (errors, siteId) => {
        if (errors) {
          let formErrors = {};
          errors.details.forEach(function(error) {
            formErrors[error.name] = error.message;                        
          });
          actions.setErrors(formErrors);
          actions.setSubmitting(false);
        } else {
          actions.setSubmitting(false);
          this.setState({saveSuccess: true});
        }
      }
    );
  }

  render() {
    let content;
    const isLoading = (this.state.site === undefined || this.state.site === '');
  
    if (isLoading) {
      content = <Loading />
    } else {
          
      let msgSaveSuccess = (
        <div className="alert alert-success" role="alert">
          La modification a été enregistrée avec succès ! 
        </div> 
      )

      content = (
        <div className="my-4">
          <h4>Associer des professeurs à un site WordPress</h4>
          { this.state.saveSuccess && msgSaveSuccess }
          <p>Pour le site <a href={this.state.site.url} target="_blank">{this.state.site.url}</a>, veuillez sélectionner ci-dessous les professeurs à associer: </p>
          <Formik
            onSubmit={ this.submit }
            initialValues={ { professors: this.state.site.professors } }
            validateOnBlur={ false }
            validateOnChange={ false }
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
            <form onSubmit={ handleSubmit } className="bg-white border p-4">
              <div className="form-group clearfix">
                <MySelect
                  id="professors"
                  value={values.professors}
                  onChange={setFieldValue}
                  onBlur={setFieldTouched}
                  error={errors.professors}
                  touched={touched.professors}
                  options={this.state.professors}
                  saveSuccess={this.updateSaveSuccess}
                  placeholder="Sélectionner un professeur"
                  name="professors"
                />
              </div>
              <div className="my-1 text-right ">
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
            )}
          </Formik>
        </div>
      )
    }
    return content;
  }
}

class MySelect extends React.Component {

  handleChange = value => {
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
    content = 
    (
      <div style={{ margin: '1rem 0' }}>
        <Select
          isMulti
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          value={this.props.value}
          options={this.props.options}
          getOptionLabel ={(option)=> option.sciper + " " + option.displayName }
          getOptionValue ={(option)=>option._id}
          placeholder={this.props.placeholder}
        />
        { 
          !!this.props.error &&
          this.props.touched && (
            <div style={ { color: 'red', marginTop: '.5rem' } }>{this.props.error}</div>
          )
        }
      </div>
    );
    return content;
  }
}