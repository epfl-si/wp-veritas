import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { CustomSelect, CustomInput } from '../CustomFields';
import { Formik, Field } from 'formik';

class User extends React.Component {

    submit = (values, actions) => {
        console.log(values);
        let userId = values.userId;
        Meteor.call(
            'updateRole',
            userId, 
            values.role,
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
                }
            }
        );
    }

    getRole = (userId) => {

        if (Roles.userIsInRole(userId, 'admin', Roles.GLOBAL_GROUP)) {
            return 'admin';
        } else if (Roles.userIsInRole(userId, 'tags-editor', Roles.GLOBAL_GROUP)) {
            return 'tags-editor';
        }
    }

    render() {
        let content;

        if (!this.props.users) {
            content = 'Loading ...';
        } else {
            
            content = (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Sciper</th>
                            <th scope="col">Username gaspar</th>
                            <th scope="col">Emails</th>
                            <th scope="col">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.users.map( (user, index) => (
                            <tr key={user._id}>
                                <td>{index+1}</td>
                                <td>{user._id}</td>
                                <td>{user.username}</td>
                                <td>{user.emails}</td>
                                <td><Formik
                                onSubmit={ this.submit }
                                initialValues={ { userId: user._id, role: this.getRole(user._id)} }
                                validateOnBlur={ false }
                                validateOnChange={ false }
                            >
                            {({

                                handleSubmit,

                                isSubmitting,

                            }) => (    
                                <form onSubmit={ handleSubmit }>

                                <Field name="userId" type="hidden" component={ CustomInput } />

                                <Field
                                    name="role" 
                                    component={ CustomSelect }>
                                        {this.props.roles.map((role, index) => (
                                            <option key={role._id} value={role.name}>{role.name}</option>
                                        ))}
                                </Field>
                                <button type="submit" disabled={ isSubmitting } className="btn btn-primary">Enregistrer</button>
                            </form>
                                    )}
                                    </Formik>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
    
        }

        return content;
    }
}


export default withTracker(() => {

    Meteor.subscribe('user.roles');
    Meteor.subscribe('user.list');

    return {
        users: Meteor.users.find({}).fetch(),
        roles: Meteor.roles.find({}).fetch(),
    };
    
})(User);