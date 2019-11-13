import { withTracker } from 'meteor/react-meteor-data';
import React, { Component, Fragment } from 'react';
import { AppLogs } from '../../../api/collections';
import { Link } from 'react-router-dom';
import moment from 'moment';

class LogCells extends Component {

  getDate(date){
    return moment(date).format("MM-DD-YYYY hh:mm:ss");
  }

  render() {
    
    return ( 
      <tbody>
      { this.props.logs.map( (log, index) => (
        <tr key={ log._id }>
          <td scope="row">{ index+1 }</td>
          <td>{ this.getDate(log.date) }</td>
          <td>{ log.userId }</td>
          <td>{ log.message }</td>
          <td>{ JSON.stringify(log.additional.before, Object.keys(log.additional.before).sort(), 2) }</td>
          <td>{ JSON.stringify(log.additional.after, Object.keys(log.additional.after).sort(), 2) }</td>
        </tr>
      ))}
      </tbody>
    )
  }
}

class Log extends Component {

  render() {
    let content;
    content = (
      <Fragment>
        <h4>Liste des logs</h4>
        <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col" style={ { width: "15%" } }>Date</th>
                <th scope="col">Sciper</th>
                <th scope="col">Message</th>
                <th scope="col" style={ { width: "40%" } }>Avant</th>
                <th scope="col" style={ { width: "40%" } }>Après</th>
              </tr>
            </thead>
            <LogCells logs={ this.props.logs } />
          </table>
      </Fragment>
    );
    return content;
  }
}
export default withTracker(() => {
  Meteor.subscribe('log.list');
  return {
    logs: AppLogs.find({}).fetch(),
  };
})(Log);