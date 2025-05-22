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
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
            <Routes>
              <Route path="/search" element={<Search/>} />
              <Route path="/search/*" element={<Search/>} />
              {this.props.currentUserIsAdmin || this.props.currentUserIsEditor ? (
                <React.Fragment>
                  <Route index element={<List/>} />
                  <Route path="/tags" element={<Tag/>} />
                  <Route path="/tag/:_id" element={<Tag/>} />
                  <Route path="/site-tags/*" element={<SiteTags/>} />
                </React.Fragment>
              ) : null}
              {this.props.currentUserIsAdmin ? (
                <React.Fragment>
                  <Route path="/add" element={<Add/>} />
                  <Route path="/edit/*" element={<Add/>} />
                  <Route path="/admin" element={<Admin/>} />
                  <Route path="/trash" element={<Trash/>} />
                  <Route path="/admin/log/list" element={<Log/>} />
                </React.Fragment>
              ) : null}
            </Routes>
            <Footer />
          </div>
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
