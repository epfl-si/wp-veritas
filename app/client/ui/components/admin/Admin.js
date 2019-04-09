import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import { Categories, Types, OpenshiftEnvs, Themes } from '../../../../both/collections';
import { CustomError, CustomInput } from '../CustomFields';

class Admin extends React.Component {

    submit = (collection, values, actions) => {
        
        let meteorMethodName;

        if (collection._name === 'openshiftenvs') {
            meteorMethodName = 'insertOpenshiftEnv';
        } else if (collection._name === 'types') {
            meteorMethodName = 'insertType';
        } else if (collection._name === 'themes') {
            meteorMethodName = 'insertTheme';
        } else if (collection._name === 'categories') {
            meteorMethodName = 'insertCategory';
        }

        Meteor.call(
            meteorMethodName,
            values, 
            (errors, objectId) => {
                if (errors) {
                    let formErrors = {};
                    errors.details.forEach(function(error) {
                        formErrors[error.name] = error.message;                        
                    });
                    actions.setErrors(formErrors);
                    actions.setSubmitting(false);
                } else {
                    actions.setSubmitting(false);
                    actions.resetForm();
                }
            }
        );
    }
    
    submitOpenShiftEnv = (values, actions) => {
        this.submit(OpenshiftEnvs, values, actions);
    }

    submitType = (values, actions) => {
        this.submit(Types, values, actions);
    }

    submitTheme = (values, actions) => {
        this.submit(Themes, values, actions);
    }

    submitCategory = (values, actions) => {
        this.submit(Categories, values, actions);
    }

    delete = (collection, elementID) => {

        let meteorMethodName;

        if (collection._name === 'openshift-envs') {
            meteorMethodName = 'removeOpenshiftEnv';
        } else if (collection._name === 'types') {
            meteorMethodName = 'removeType';
        } else if (collection._name === 'themes') {
            meteorMethodName = 'removeTheme';
        } else if (collection._name === 'categories') {
            meteorMethodName = 'removeCategory';
        }

        Meteor.call(
            meteorMethodName,
            elementID,
            function(error, objectId) {
                if (error) {
                    console.log(`ERROR ${collection._name} ${meteorMethodName} ${error}`);
                } 
            }
        );
    }

    deleteOpenshiftEnv = (openshiftEnvID) => {
        this.delete(OpenshiftEnvs, openshiftEnvID);
    }

    deleteType = (typeID) => {
        this.delete(Types, typeID);
    }

    deleteTheme = (themeID) => {
        this.delete(Themes, themeID);
    }

    deleteTheme = (categoryID) => {
        this.delete(Categories, categoryID);
    }

    render() {
        return (
        <div>
            <div className="card my-2">
                <h5 className="card-header">Liste des environnements openshift</h5>
                    
                <ul className="list-group">
                    {this.props.openshiftenvs.map( (env, index) => (
                        <li key={env._id} value={env.name} className="list-group-item">
                            {env.name}
                            <button type="button" className="close" aria-label="Close">
                                <span  onClick={() => this.deleteOpenshiftEnv(env._id)} aria-hidden="true">&times;</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="card-body">
                    <Formik
                            onSubmit={ this.submitOpenShiftEnv }
                            initialValues={ { name: ''} }
                            
                            validateOnBlur={ false }
                            validateOnChange={ false }
                        >
                        {({
                            handleSubmit,
                            isSubmitting,
                        }) => (    
                            <form onSubmit={ handleSubmit } className="">
                                <Field placeholder="Nom de l'environnement openshift à ajouter" name="name" type="text" component={ CustomInput }/>
                                <ErrorMessage name="name" component={ CustomError } />
                                <div className="my-1 text-right">
                                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                            
                        )}
                    </Formik>
                </div>
            </div>

            <div className="card my-2">

                <h5 className="card-header">Liste des types des sites WordPress</h5>
    
                <ul className="list-group">
                    {this.props.types.map( (type, index) => (
                        <li key={type._id} value={type.name} className="list-group-item">
                            {type.name}
                            <button type="button" className="close" aria-label="Close">
                                <span  onClick={() => this.deleteType(type._id)} aria-hidden="true">&times;</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="card-body">
                    <Formik
                            onSubmit={ this.submitType }
                            initialValues={ { name: ''} }
                            validationSchema={ this.nameSchema }
                            validateOnBlur={ false }
                            validateOnChange={ false }
                        >
                        {({
                            handleSubmit,
                            isSubmitting,
                        }) => (    
                            <form onSubmit={ handleSubmit } className="">
                                <Field placeholder="Nom du type à ajouter" name="name" type="text" component={ CustomInput } />
                                <ErrorMessage name="name" component={ CustomError } />
                                <div className="my-1 text-right">
                                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
                
            </div>

            <div className="card my-2">

                <h5 className="card-header">Liste des catégories des sites WordPress</h5>
    
                <ul className="list-group">
                    {this.props.categories.map( (category, index) => (
                        <li key={category._id} value={category.name} className="list-group-item">
                            {category.name}
                            <button type="button" className="close" aria-label="Close">
                                <span  onClick={() => this.deleteCategory(category._id)} aria-hidden="true">&times;</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="card-body">
                    <Formik
                            onSubmit={ this.submitCategory }
                            initialValues={ { name: ''} }
                            validationSchema={ this.nameSchema }
                            validateOnBlur={ false }
                            validateOnChange={ false }
                        >
                        {({
                            handleSubmit,
                            isSubmitting,
                        }) => (    
                            <form onSubmit={ handleSubmit } className="">
                                <Field placeholder="Nom de la catégorie à ajouter" name="name" type="text" component={ CustomInput } />
                                <ErrorMessage name="name" component={ CustomError } />
                                <div className="my-1 text-right">
                                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
                
            </div>
            
            <div className="card my-2">
                <h5 className="card-header">Liste des thèmes des sites WordPress</h5>
        
                <ul className="list-group">
                    {this.props.themes.map( (theme, index) => (
                        <li key={theme._id} value={theme.name} className="list-group-item">
                            {theme.name}
                            <button type="button" className="close" aria-label="Close">
                                <span  onClick={() => this.deleteTheme(theme._id)} aria-hidden="true">&times;</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="card-body">
                    <Formik
                            onSubmit={ this.submitTheme }
                            initialValues={ { name: ''} }
                            validationSchema={ this.nameSchema }
                            validateOnBlur={ false }
                            validateOnChange={ false }
                        >
                        {({
                            handleSubmit,
                            isSubmitting,
                        }) => (    
                            <form onSubmit={ handleSubmit } className="">
                                <Field placeholder="Nom du thème à ajouter" name="name" type="text" component={ CustomInput } className="" />
                                <ErrorMessage name="name" component={ CustomError } />
                                <div className="my-1 text-right">
                                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
        )
    }
}

export default withTracker(() => {
    
    Meteor.subscribe('openshiftEnv.list');
    Meteor.subscribe('type.list');
    Meteor.subscribe('theme.list');
    Meteor.subscribe('category.list');

    return {
        openshiftenvs: OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch(),
        types: Types.find({}, {sort: {name:1 }}).fetch(),
        themes: Themes.find({}, {sort: {name:1 }}).fetch(),
        categories: Categories.find({}, {sort: {name:1 }}).fetch(),
    };
    
})(Admin);
