import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Header, Footer, Add, List, Admin, User, Search, Tag, SiteTags, Api } from './components'; 
import { BrowserRouter as Router, Route } from 'react-router-dom';

class Apps extends React.Component {

  render() {
    
    let isAdmin;
    let isTagsEditor;

    if (this.props.currentUser === undefined) {
      return 'Loading';

    } else {
      isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin', Roles.GLOBAL_GROUP);
      isTagsEditor = Roles.userIsInRole(Meteor.userId(), 'tags-editor', Roles.GLOBAL_GROUP);
    }

    return (
      <Router>
        <div className="App container">
          
          <Header  />      
          <Route path="/search" component={ Search } />

          { isAdmin || isTagsEditor ? 
            (<React.Fragment>
              <Route exact path="/" component={ List } />
              <Route path="/tags" component={ Tag }/>
              <Route path="/tag/:_id" component={ Tag }/>
              <Route path="/site-tags/:_id" component={ SiteTags }/>
            </React.Fragment>): null}
              
          { isAdmin ?   
            (<React.Fragment>
            <Route exact path="/add" component={ Add } />
            <Route path="/edit/:_id" component={ Add } />
            <Route exact path="/admin" component={ Admin } />
            <Route exact path="/admin/users" component={ User } />
            </React.Fragment>)
           : null}
         

          <Footer />
        </div>
      </Router>
      )
  }
}

export default withTracker(() => {
  
  return {
    currentUser: Meteor.users.findOne({'_id': Meteor.userId()}),
  };
  
})(Apps);
