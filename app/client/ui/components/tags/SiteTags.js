import React from 'react';
import Select from 'react-select';
import { Formik } from 'formik';
import { Tags, Sites } from '../../../../both/collections';

export default class SiteTags extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            add_success: false,
            facultyTags: [],
            instituteTags: [],
            fieldOfResearchTags: [],
            site: '',
        }
    }
    
    componentWillMount() {
        let siteId = this.props.match.params._id;
        Meteor.subscribe('site.single', siteId);
        Meteor.subscribe('tag.list');

        Tracker.autorun(() => {
            let site = Sites.findOne({_id: this.props.match.params._id});
            let facultyTags = Tags.find(
                {type: 'faculty'}, 
                {sort: {name_fr: this.state.orderName}
            }).fetch();
            let instituteTags = Tags.find(
                {type: 'institute'}, 
                {sort: {name_fr: this.state.orderName}
            }).fetch();
            let fieldOfResearchTags = Tags.find(
                {type: 'field-of-research'}, 
                {sort: {name_fr: this.state.orderName}
            }).fetch();

            this.setState({
                facultyTags: facultyTags, 
                instituteTags: instituteTags, 
                fieldOfResearchTags: fieldOfResearchTags,
                site: site,
            });
        })
    }

    submit = (values, actions) => {    
        let tags = [
            ...values.facultyTags, 
            ...values.instituteTags, 
            ...values.fieldOfResearchTags
        ];
        Meteor.call(
            'associateTagsToSite',
            this.state.site,
            tags, 
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
                    this.setState({add_success: true});
                }
            }
        );
    }

    render() {
        let content;
        let msg_site_tags_success = (
            <div className="alert alert-success" role="alert">
              Les tags ont été enregistrés avec succès ! 
            </div> 
          )
        const isLoading = (this.state.site === undefined || this.state.site === '');
    
        if (isLoading) {
            content = <h1>Loading....</h1>
        } else {
            content = (
                <div className="my-4">
                    <h4>Associer des tags à un site WordPress</h4>
                    <p>Pour le site <a href={this.state.site.url} target="_blank">{this.state.site.url}</a>, veuillez sélectionner ci-dessous les tags à associer: </p>

                    { this.state.add_success && msg_site_tags_success }
                    <Formik
                        onSubmit={ this.submit }
                        initialValues={ {facultyTags: this.state.site.tags.filter(tag => tag.type === 'faculty'), instituteTags:this.state.site.tags.filter(tag => tag.type === 'institute'), fieldOfResearchTags: this.state.site.tags.filter(tag => tag.type === 'field-of-research')} }
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
                                id="facultyTags"
                                value={values.facultyTags}
                                onChange={setFieldValue}
                                onBlur={setFieldTouched}
                                error={errors.facultyTags}
                                touched={touched.facultyTags}
                                options={this.state.facultyTags}
                                placeholder="Sélectionner un tag faculté"
                                name="facultyTags"
                            />
                            <MySelect
                                value={values.instituteTags}
                                onChange={setFieldValue}
                                onBlur={setFieldTouched}
                                error={errors.instituteTags}
                                touched={touched.instituteTags}
                                options={this.state.instituteTags}
                                placeholder="Sélectionner un tag institut"
                                name="instituteTags"
                            />
                            <MySelect
                                value={values.fieldOfResearchTags}
                                onChange={setFieldValue}
                                onBlur={setFieldTouched}
                                error={errors.fieldOfResearchTags}
                                touched={touched.fieldOfResearchTags}
                                options={this.state.fieldOfResearchTags}
                                placeholder="Sélectionner un tag domaine de recherche"
                                name="fieldOfResearchTags"
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
        // this is going to call setFieldValue and manually update values.topcis
        this.props.onChange(this.props.name, value);
    };

    handleBlur = () => {
        // this is going to call setFieldTouched and manually update touched.topcis
        this.props.onBlur(this.props.name, true);
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
          getOptionLabel ={(option)=>option.name_fr}
          getOptionValue ={(option)=>option._id}
          placeholder={this.props.placeholder}
          
        />
        {!!this.props.error &&
          this.props.touched && (
            <div style={{ color: 'red', marginTop: '.5rem' }}>{this.props.error}</div>
          )}
      </div>
    );

    return content;
  }
}