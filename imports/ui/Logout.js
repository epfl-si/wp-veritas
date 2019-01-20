import { Component } from 'react';
 
export default class Logout extends Component {

  constructor(props) {
    super(props); 
  }

  componentDidMount() {  
    Tracker.autorun(()=>{
    if (Meteor.userId()) {
        Meteor.logout();
    }
    this.props.history.push('/list');
    });
  }

  render() {
    return '';
  }
}