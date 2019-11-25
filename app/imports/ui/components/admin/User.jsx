import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import React, {Component } from 'react';
import { CustomSelect, CustomInput } from '../CustomFields';
import { Formik, Field } from 'formik';
import { Loading } from '../Messages';

class UserForm extends Component {

  submit = (values, actions) => {
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

  render() {
    return ( 
      <Formik
        onSubmit={ this.submit }
        initialValues={ { userId: this.props.user._id, role: this.props.getRole(this.props.user._id)} }
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
    )
  }
}

class User extends Component {
  
  getRole = (userId) => {
    if (Roles.userIsInRole(userId, 'admin', Roles.GLOBAL_GROUP)) {
      return 'admin';
    } else if (Roles.userIsInRole(userId, 'tags-editor', Roles.GLOBAL_GROUP)) {
      return 'tags-editor';
    }
  }

  isLoading = () => {
    const isLoading = (
      this.props.users === undefined || 
      this.props.roles === undefined 
    );
    return isLoading; 
  }

  render() {
    let content;
    if (this.isLoading()) {
      content = <Loading />;
    } else {
      content = (
        <table className="table table-striped">
          <thead>
            <tr>
              <th className="w-5" scope="col">#</th>
              <th className="w-10" scope="col">Sciper</th>
              <th className="w-25" scope="col">Username gaspar</th>
              <th className="w-25" scope="col">Emails</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {this.props.users.map( (user, index) => (
              <tr key={ user._id }>
                <td>{ index+1 }</td>
                <td>{ user._id }</td>
                <td>{ user.username }</td>
                <td>{ user.emails }</td>
                <td>
                  <UserForm 
                    user= { user }
                    roles={ this.props.roles }
                    getRole={ this.getRole }
                  />
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