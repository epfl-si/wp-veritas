import React from 'react';
import { Tags } from '../../../../both/collections';
import { Formik, Field, ErrorMessage } from 'formik';
import { CustomError, CustomInput, CustomSelect } from '../CustomFields';
import { Link } from "react-router-dom";

export default class Tag extends React.Component {

    constructor(props) {
        super(props);

        let action;
        if (this.props.match.path.startsWith('/tag/')) {
            action = 'edit';
        } else {
            action = 'add';
        }
        
        this.state = {
            action: action,
            orderName: 1,
            orderUrl: 0,
            orderType: 0,
            tags: [],
            tag: '',
        }
    }
    
    componentWillMount() {

        Meteor.subscribe('tag.list');
        Tracker.autorun(() => {
            let tags = Tags.find({}, {sort: {name: this.state.orderName}}).fetch();
            let tag = '';
            if (this.state.action === 'edit') {
                tag = Tags.findOne({_id: this.props.match.params._id});
            }
            this.setState({tags: tags, tag:tag});
        })
    }

    submit = (values, actions) => {

        let meteorMethodName;
        if (this.state.action === 'add') {
            meteorMethodName = 'insertTag';
        } else if (this.state.action === 'edit') {
            meteorMethodName = 'updateTag';
        }

        Meteor.call(
            meteorMethodName,
            values, 
            (errors, siteId) => {
                if (errors) {
                    console.log(errors);
                    let formErrors = {};
                    errors.details.forEach(function(error) {
                        formErrors[error.name] = error.message;                        
                    });
                    actions.setErrors(formErrors);
                    actions.setSubmitting(false);
                } else {
                    actions.setSubmitting(false);
                    actions.resetForm();
                    if (meteorMethodName == 'updateTag') {
                        this.props.history.push('/tags');
                    }
                }
            }
        );
    }

    deleteTag(tagId) {
        Meteor.call(
            'removeTag',
            tagId,
            function(error, tagId) {
                if (error) {
                    console.log(`ERROR deleteTag ${error}`);
                } 
            }
        );
    }

    sortName() {
        let sort;
        if (this.state.orderName == 0 || this.state.orderName == 1) {
            sort = -1;
        } else if (this.state.orderName == 0 || this.state.orderName == -1) {
            sort = 1;
        }
        let tags = Tags.find({}, {sort: {name: sort}}).fetch();
        this.setState({orderName: sort, orderType: 0, orderUrl:0, tags: tags});
    }
    sortUrl() {
        let sort;
        if (this.state.orderUrl == 0 || this.state.orderUrl == 1) {
            sort = -1;
        } else if (this.state.orderUrl == 0 || this.state.orderUrl == -1) {
            sort = 1;
        }
        let tags = Tags.find({}, {sort: {url: sort}}).fetch();
        this.setState({orderName: 0, orderType: 0, orderUrl:sort, tags: tags});
    }
    sortType() {
        let sort;
        if (this.state.orderType == 0 || this.state.orderType == 1) {
            sort = -1;
        } else if (this.state.orderType == 0 || this.state.orderType == -1) {
            sort = 1;
        }
        let tags = Tags.find({}, {sort: {type: sort}}).fetch();
        this.setState({orderName: 0, orderType: sort, orderUrl:0, tags: tags});
    }

    render() {
        
        let content;

        if ((!this.state.tags && this.state.action === 'add') || ((!this.state.tags || !this.state.tag) && this.state.action === 'edit')) {
            return "Loading";
        } else {

            let initialValues;
            let title;
            let edit;
            let orderNameClassName;
            let orderUrlClassName;
            let orderTypeClassName;

            if (this.state.action === 'edit') {
                title = `Editer le tag ${this.state.tag.name}`;
                initialValues = this.state.tag;
                edit = true;
            } else {
                title = 'Ajouter un tag';
                initialValues = {name:'', url: '', type: 'faculty'};
                edit = false;

                if (this.state.orderName == 0) {
                    orderNameClassName = "fa fa-fw fa-sort";
                } else if (this.state.orderName == 1) {
                    orderNameClassName = "fa fa-fw fa-sort-asc";
                } else if (this.state.orderName == -1) {
                    orderNameClassName = "fa fa-fw fa-sort-desc";
                }
                
                if (this.state.orderUrl == 0) {
                    orderUrlClassName = "fa fa-fw fa-sort";
                } else if (this.state.orderUrl == 1) {
                    orderUrlClassName = "fa fa-fw fa-sort-asc";
                } else if (this.state.orderUrl == -1) {
                    orderUrlClassName = "fa fa-fw fa-sort-desc";
                }

                if (this.state.orderType == 0) {
                    orderTypeClassName = "fa fa-fw fa-sort";
                } else if (this.state.orderType == 1) {
                    orderTypeClassName = "fa fa-fw fa-sort-asc";
                } else if (this.state.orderType == -1) {
                    orderTypeClassName = "fa fa-fw fa-sort-desc";
                }
            }

            content = (
                <div>
                <div className="card my-2">
                    <h5 className="card-header">{title}</h5>
                    <Formik
                            onSubmit={ this.submit }
                            initialValues={ initialValues }
                            validateOnBlur={ false }
                            validateOnChange={ false }
                        >
                        { ({
                            handleSubmit,
                            isSubmitting,
                            values,
                        }) => (              
                            <form onSubmit={ handleSubmit } className="bg-white border p-4">   
                                <Field placeholder="Nom du tag" label="Nom" name="name" type="text" component={ CustomInput } />
                                <ErrorMessage name="name" component={ CustomError } />
    
                                <Field placeholder="URL du tag" label="URL" name="url" type="text" component={ CustomInput } />
                                <ErrorMessage name="url" component={ CustomError } />
    
                                <Field label="Type" name="type" component={ CustomSelect }>                        
                                <option value="faculty">Faculté</option>
                                <option value="institute">Institut</option>
                                <option value="field-of-research">Domaine de recherche</option>                        
                                </Field>
                                <ErrorMessage name="type" component={ CustomError } />
                                    <div className="my-1 text-right">
                                    <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
                { edit ? '' : (
                <div className="card my-2">
                    <h5 className="card-header">Liste des tags</h5>
                    <table className="table">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Nom <i className={orderNameClassName} onClick={() => this.sortName() }></i></th>
                                <th scope="col">URL <i className={orderUrlClassName} onClick={() => this.sortUrl() }></i></th>
                                <th scope="col">Type <i className={orderTypeClassName} onClick={() => this.sortType() }></i></th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.state.tags.map( (tag, index) => (
                            <tr key={tag._id}>
                                <td>{index+1}</td>
                                <td>{tag.name}</td>
                                <td><a href={tag.url} target="_blank">{tag.url}</a></td>
                                <td>{tag.type}</td>
                                <td>
                                    <Link className="mr-2" to={`/tag/${tag._id}`}>
                                        <button type="button" className="btn btn-outline-primary">Éditer</button>
                                    </Link>
                                    <button type="button" className="close" aria-label="Close">
                                        <span  onClick={() => this.deleteTag(tag._id)} aria-hidden="true">&times;</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                )}
                </div>
            )

        }

        return content;
    }
}