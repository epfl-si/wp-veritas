import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import {
  Header,
  Footer,
  Add,
  List,
  Admin,
  Search,
  Tag,
  SiteTags,
  Log,
  Professor,
  Trash,
} from "./components";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Loading } from "../ui/components/Messages";
import { getEnvironment } from "../api/utils";

class Apps extends Component {
  render() {
    if (this.props.isLoading) {
      return <Loading />;
    } else {
      const ribbon = (
        <div className="ribbon-wrapper">
          <div className="ribbon">{getEnvironment()}</div>
        </div>
      );

      return (
        <Router>
          <div className="App container">
            {getEnvironment() === "PROD" ? null : ribbon}
            <Header />
            <Route exact path="/search" component={Search} />
            <Route path="/search/*" component={Search} />
            {this.props.currentUserIsAdmin || this.props.currentUserIsEditor ? (
              <React.Fragment>
                <Route exact path="/" component={List} />
                <Route path="/tags" component={Tag} />
                <Route path="/tag/:_id" component={Tag} />
                <Route path="/site-tags/*" component={SiteTags} />
              </React.Fragment>
            ) : null}
            {this.props.currentUserIsAdmin ? (
              <React.Fragment>
                <Route path="/add" component={Add} />
                <Route path="/edit/*" component={Add} />
                <Route exact path="/admin" component={Admin} />
                <Route exact path="/trash" component={Trash} />
                <Route path="/admin/log/list" component={Log} />
              </React.Fragment>
            ) : null}
            <Footer />
          </div>
          {/*  @TODO: refactor in a RedirectAPI.jsx component */}
          <Route path="/api" component={() => { global.window && (global.window.location.href = '/api/index.html'); return null; } } />
          <Route path="/api/v1" component={() => { global.window && (global.window.location.href = '/api/index.html'); return null; } } />
          <Route path="/api/doc" component={() => { global.window && (global.window.location.href = '/api/index.html'); return null; } } />
        </Router>
      );
    }
  }
}
export default withTracker(() => {
  let isAdmin = Roles.userIsInRole(Meteor.userId(), ["admin"], "wp-veritas");
  let isEditor = Roles.userIsInRole(
    Meteor.userId(),
    ["tags-editor"],
    "wp-veritas"
  );
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
})(Apps);
