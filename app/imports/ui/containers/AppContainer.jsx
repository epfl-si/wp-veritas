import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import App from '../App.jsx';

export default withTracker(() => {
  let isAdmin = Roles.userIsInRole(Meteor.userId(), ["admin"], "wp-veritas");
  let isEditor = Roles.userIsInRole(Meteor.userId(), ["tags-editor"], "wp-veritas");
  let isRole = isAdmin || isEditor;
  let isLoading;

  if (isRole) {
    isLoading = Meteor.user() === undefined;
    currentUser = Meteor.user();
  } else {
    isLoading = false;
    currentUser = "";
  }

  return {
    isLoading: isLoading,
    currentUser: currentUser,
    currentUserIsAdmin: isAdmin,
    currentUserIsEditor: isEditor,
  };
})(App);