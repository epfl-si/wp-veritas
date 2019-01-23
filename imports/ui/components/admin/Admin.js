import React from 'react';
import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import { Types, OpenshiftEnvs, Themes } from '../../../api/collections';
import { CustomError, CustomInput } from '../sites/CustomFields';
import { REQUIRED_MSG } from '../Messages';

export default class AddOpenshiftEnvs extends React.Component {

    nameSchema = Yup.object().shape({
        name: Yup.string().required(REQUIRED_MSG),  
    })

    constructor(props){
        super(props);
    
        this.state = {
            openshiftenvs: [],
            types:[],
            themes: [],
        }
    }

    componentDidMount() {
        Tracker.autorun(() => {
          let openshiftenvs = OpenshiftEnvs.find({}, {sort: {name: 1}}).fetch();
          let types = Types.find({}, {sort: {name:1 }}).fetch();
          let themes = Themes.find({}, {sort: {name:1 }}).fetch();
          this.setState({openshiftenvs: openshiftenvs, types: types, themes: themes});
        });
    }

    submit = (collection, values, actions) => {
        collection.insert(values);
        actions.setSubmitting(false);
        actions.resetForm();
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

    delete = (collection, elements, elementID) => {
        const newElements = [...elements.filter(element => element._id !== elementID)];
        this.setState({newElements});
        collection.remove({_id:elementID});
    }

    deleteOpenshiftEnv = (openshiftEnvID) => {
        this.delete(OpenshiftEnvs, this.state.openshiftenvs, openshiftEnvID);
    }

    deleteType = (typeID) => {
        this.delete(Types, this.state.types, typeID);
    }

    deleteTheme = (themeID) => {
        this.delete(Themes, this.state.themes, themeID);
    }

    render() {

        return (
            <div className="container-fluid p-4">
                <h2>Liste des environnements openshift</h2>
                <div className="row col-6">
                    
                    <ul className="list-group w-100">
                        {this.state.openshiftenvs.map( (env, index) => (
                            <li key={env._id} value={env.name} className="list-group-item">
                                {env.name}
                                <button type="button" className="close" aria-label="Close">
                                    <span  onClick={() => this.deleteOpenshiftEnv(env._id)} aria-hidden="true">&times;</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="row col-6 pt-4">
                    <Formik
                            onSubmit={ this.submitOpenShiftEnv }
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
                                <h2>Ajouter un nouvel environnement openshift</h2>  
                                <Field label="Nom de l'environnement openshift" name="name" type="text" component={ CustomInput } className="" />
                                <ErrorMessage name="name" component={ CustomError } />
                                <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                            </form>
                        )}
                    </Formik>
                </div>

                <h2 className="pt-4">Liste des types des sites WordPress</h2>
                <div className="row col-6">
                    
                    <ul className="list-group w-100">
                        {this.state.types.map( (type, index) => (
                            <li key={type._id} value={type.name} className="list-group-item">
                                {type.name}
                                <button type="button" className="close" aria-label="Close">
                                    <span  onClick={() => this.deleteType(type._id)} aria-hidden="true">&times;</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="row col-6 pt-4">
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
                                <h2>Ajouter un nouveau type</h2>  
                                <Field label="Nom du type" name="name" type="text" component={ CustomInput } className="" />
                                <ErrorMessage name="name" component={ CustomError } />
                                <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                            </form>
                        )}
                    </Formik>
                </div>

                <h2 className="pt-4">Liste des thèmes des sites WordPress</h2>
                <div className="row col-6">
                    
                    <ul className="list-group w-100">
                        {this.state.themes.map( (theme, index) => (
                            <li key={theme._id} value={theme.name} className="list-group-item">
                                {theme.name}
                                <button type="button" className="close" aria-label="Close">
                                    <span  onClick={() => this.deleteTheme(theme._id)} aria-hidden="true">&times;</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="row col-6 pt-4">
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
                                <h2>Ajouter un nouveau thème</h2>  
                                <Field label="Nom du thème" name="name" type="text" component={ CustomInput } className="" />
                                <ErrorMessage name="name" component={ CustomError } />
                                <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                            </form>
                        )}
                    </Formik>
                </div>
            </div>
        )
    }
}
