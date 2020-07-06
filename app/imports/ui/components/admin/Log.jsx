import { withTracker } from 'meteor/react-meteor-data';
import React, { Component, Fragment } from 'react';
import { AppLogs } from '../../../api/collections';
import { Loading } from "../Messages";
import moment from 'moment';

class LogCells extends Component {

  getDate(date){
    return moment(date).format("MM-DD-YYYY hh:mm:ss");
  }

  displayBefore(log) {
    let result;
    result = JSON.stringify(log.additional.before, Object.keys(log.additional.before).sort(), 2);
    return result;
  }

  displayAfter(log) {
    let result;
    result = JSON.stringify(log.additional.after, Object.keys(log.additional.after).sort(), 2);
    return result;
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
          <td className="log-status">{ this.displayBefore(log) }</td>
          <td className="log-status">{ this.displayAfter(log) }</td>
        </tr>
      ))}
      </tbody>
    )
  }
}

class Log extends Component {

  render() {
    let content;
    if (this.props.loading && this.props.logs.length > 0) {
      content = <Loading />;
    } else {
      console.log(this.props);
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
    }
    return content;
  }
}
export default withTracker(() => {
  const handle = Meteor.subscribe('log.list');
  return {
    loading: !handle.ready(),
    logs: AppLogs.find({}, {sort: {date: -1}}).fetch(),
  };
})(Log);