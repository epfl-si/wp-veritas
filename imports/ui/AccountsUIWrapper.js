import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
 
export default class AccountsUIWrapper extends Component {

  componentDidMount() {
    // Use Meteor Blaze to render login buttons
    this.view = Blaze.render(Template.atForm,
      ReactDOM.findDOMNode(this.refs.container));

      Tracker.autorun(()=>{
        if (Meteor.userId()) {
          this.props.history.push('/list');
        } 
      });
  }
  componentWillUnmount() {
    // Clean up Blaze view
    Blaze.remove(this.view);
  }
  
  render() {
    
    // Just render a placeholder container that will be filled in
    return (
      <div className="container-fluid p-5 bg-light 
        d-flex flex-column justify-content-center align-items-center">
        <span ref="container" className="bg-white border p-5 d-flex flex-column"/>
      </div>
    );
  }
}