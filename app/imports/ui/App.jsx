import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Header, Footer, Add, List, Admin, Search, Tag, SiteTags, Log, Professor, SiteProfessors } from './components'; 
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Loading } from '../ui/components/Messages';

class Apps extends Component {

  getEnvironment() {
    const absoluteUrl = Meteor.absoluteUrl();
    let environment;
    if (absoluteUrl.startsWith('http://localhost:3000/')) {
      environment = "LOCALHOST";
    } else if (absoluteUrl.startsWith('https://wp-veritas.128.178.222.83.nip.io/')) {
      environment = "TEST";
    } else {
      environment = "PROD";
    }
    return environment;
  }

  render() {
    
    let isAdmin;
    let isTagsEditor;

    if (this.props.currentUser === undefined) {
      return <Loading />;
    } else {
      isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin', Roles.GLOBAL_GROUP);
      isTagsEditor = Roles.userIsInRole(Meteor.userId(), 'tags-editor', Roles.GLOBAL_GROUP);
    }

    const ribbon = (
      <div className="ribbon-wrapper">
          <div className="ribbon">{ this.getEnvironment() }</div>
        </div>
    );

    return (
      <Router>
        <div className="App container">
          { this.getEnvironment() === "PROD" ? null : ribbon }
          <Header />
          <Route path="/search" component={ Search } />
          { isAdmin || isTagsEditor ?
            (<React.Fragment>
              <Route exact path="/" component={ List } />
              <Route path="/tags" component={ Tag } />
              <Route path="/tag/:_id" component={ Tag } />
              <Route path="/site-tags/:_id" component={ SiteTags } />
              <Route exact path="/professors" component={ Professor } />
              <Route path="/site-professors/:_id" component={ SiteProfessors } />
            </React.Fragment>): null}
          { isAdmin ?   
            (<React.Fragment>
            <Route path="/add" component={ Add } />
            <Route path="/edit/:_id" component={ Add } />
            <Route exact path="/admin" component={ Admin } />
            <Route path="/admin/log/list" component={ Log } />
            </React.Fragment>)
           : null}
          <Footer />
        </div>
      </Router>
    )
  }
}
export default withTracker(() => {
  let user = Meteor.users.findOne({'_id': Meteor.userId()});
  return {  
    currentUser: user,
  };  
})(Apps);
