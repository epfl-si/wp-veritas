import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Header, Footer, Add, List, Admin, User, Search, Tag, SiteTags, Log, Professor } from './components'; 
import { BrowserRouter as Router, Route } from 'react-router-dom';

class Apps extends Component {

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
              <Route exact path="/professors" component={ Professor }/>
              <Route path="/professor/:_id/edit" component={ Professor }/>
            </React.Fragment>): null}
              
          { isAdmin ?   
            (<React.Fragment>
            <Route exact path="/add" component={ Add } />
            <Route path="/edit/:_id" component={ Add } />
            <Route exact path="/admin" component={ Admin } />
            <Route exact path="/admin/users" component={ User } />
            <Route exact path="/admin/log/list" component={ Log } />
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
