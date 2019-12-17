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
          <td className="log-status">{ JSON.stringify(log.additional.before, Object.keys(log.additional.before).sort(), 2) }</td>
          <td className="log-status">{ JSON.stringify(log.additional.after, Object.keys(log.additional.after).sort(), 2) }</td>
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
        <h4 className="py-4">Liste des logs</h4>
        <table className="table table-striped">
            <thead>
              <tr>
                <th className="w-5" scope="col">#</th>
                <th className="w-15" scope="col">Date</th>
                <th className="w-10" scope="col">Sciper</th>
                <th className="w-15" scope="col">Message</th>
                <th scope="col">Avant</th>
                <th scope="col">Après</th>
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
    logs: AppLogs.find({}, {sort: {date: -1}}).fetch(),
  };
})(Log);