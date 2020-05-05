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
  SiteProfessors,
} from "./components";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Loading } from "../ui/components/Messages";

class Apps extends Component {
  getEnvironment() {
    const absoluteUrl = Meteor.absoluteUrl();
    let environment;
    if (absoluteUrl.startsWith("http://localhost:3000/")) {
      environment = "LOCALHOST";
    } else if (
      absoluteUrl.startsWith("https://wp-veritas.128.178.222.83.nip.io/")
    ) {
      environment = "TEST";
    } else {
      environment = "PROD";
    }
    return environment;
  }

  render() {
    if (this.props.isLoading) {
      return <Loading />;
    } else {
      console.log(this.props);
      const ribbon = (
        <div className="ribbon-wrapper">
          <div className="ribbon">{this.getEnvironment()}</div>
        </div>
      );

      return (
        <Router>
          <div className="App container">
            {this.getEnvironment() === "PROD" ? null : ribbon}
            <Header />
            <Route path="/search" component={Search} />
            {this.props.currentUserIsAdmin || this.props.currentUserIsEditor ? (
              <React.Fragment>
                <Route exact path="/" component={List} />
                <Route path="/tags" component={Tag} />
                <Route path="/tag/:_id" component={Tag} />
                <Route path="/site-tags/:_id" component={SiteTags} />
                <Route exact path="/professors" component={Professor} />
                <Route
                  path="/site-professors/:_id"
                  component={SiteProfessors}
                />
              </React.Fragment>
            ) : null}
            {this.props.currentUserIsAdmin ? (
              <React.Fragment>
                <Route path="/add" component={Add} />
                <Route path="/edit/:_id" component={Add} />
                <Route exact path="/admin" component={Admin} />
                <Route path="/admin/log/list" component={Log} />
              </React.Fragment>
            ) : null}
            <Footer />
          </div>
        </Router>
      );
    }
  }
}
export default withTracker(() => {
  let isAdmin = Roles.userIsInRole(Meteor.userId(), ["admin"], "medium");
  let isEditor = Roles.userIsInRole(Meteor.userId(), ["editor"], "medium");
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
