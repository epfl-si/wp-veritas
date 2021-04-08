import React, { Component } from "react";
import { Link, NavLink, withRouter } from "react-router-dom";
import { withTracker } from "meteor/react-meteor-data";
import logo from "./Logo_EPFL.svg";
import { Loading } from "../Messages";

class Header extends Component {
  getRole() {
    let role;
    if (this.props.currentUserIsAdmin) {
      role = "Admin";
    } else if (this.props.currentUserIsEditor) {
      role = "Éditeur";
    } else {
      role = "Membre EPFL";
    }
    return role;
  }

  render() {
    let content;
    if (this.props.isLoading) {
      content = <Loading />;
    } else {
      let peopleUrl = "https://people.epfl.ch/" + this.props.currentUser._id;
      let role = this.getRole();

      content = (
        <header className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <Link className="navbar-brand" to="/">
            <img src={logo} className="App-logo" alt="logo" />
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  id="navbarDropdown"
                  role="button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Source de vérité
                </a>
                <div className="dropdown-menu">
                  {this.props.currentUserIsAdmin ||
                  this.props.currentUserIsEditor ? (
                    <NavLink
                      className="dropdown-item"
                      exact
                      to="/"
                      activeClassName="active"
                    >
                      Voir la source de vérité
                    </NavLink>
                  ) : null}
                  <NavLink
                    className="dropdown-item"
                    to="/search"
                    activeClassName="active"
                  >
                    Instance WordPress ?
                  </NavLink>
                  {this.props.currentUserIsAdmin ? (
                    <NavLink
                      className="dropdown-item"
                      to="/add"
                      activeClassName="active"
                    >
                      Ajouter un nouveau site
                    </NavLink>
                  ) : null}
                </div>
              </li>
              {this.props.currentUserIsAdmin ||
              this.props.currentUserIsEditor ? (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    id="navbarDropdown"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Tags
                  </a>
                  <div className="dropdown-menu">
                    <NavLink
                      className="dropdown-item"
                      to="/tags"
                      activeClassName="active"
                    >
                      Gestion des tags
                    </NavLink>
                  </div>
                </li>
              ) : null}
              {this.props.currentUserIsAdmin ||
              this.props.currentUserIsEditor ? (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    id="navbarDropdown"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Professeurs
                  </a>
                  <div className="dropdown-menu">
                    <NavLink
                      className="dropdown-item"
                      to="/professors"
                      activeClassName="active"
                    >
                      Gestion des professeurs
                    </NavLink>
                  </div>
                </li>
              ) : null}
              {this.props.currentUserIsAdmin ? (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    id="navbarDropdown"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Admins
                  </a>
                  <div className="dropdown-menu">
                    <NavLink
                      className="dropdown-item"
                      exact
                      to="/admin"
                      activeClassName="active"
                    >
                      Admin
                    </NavLink>
                    <NavLink
                      className="dropdown-item"
                      exact
                      to="/trash"
                      activeClassName="active"
                      >
                        Corbeille
                    </NavLink>
                    <NavLink
                      className="dropdown-item"
                      to="/admin/log/list"
                      activeClassName="active"
                    >
                      Voir les logs
                    </NavLink>
                    <div className="dropdown-item">Version 1.12.5</div>
                  </div>
                </li>
              ) : null}
              {this.props.currentUserIsAdmin ? (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    id="navbarDropdown"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    API
                  </a>
                  <div className="dropdown-menu">
                    <a className="dropdown-item" target="_blank" href="/api">Documentation de l'API</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/inventory/entries">Voir tous les sites</a>
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="userMenu">
            <div>
              <span className="navbar-text">Utilisateur:</span>&nbsp;
              <a target="_blank" href={peopleUrl}>
                {this.props.currentUser.username}
              </a>
              <span className="navbar-text">&nbsp;({role})</span>
            </div>
          </div>
        </header>
      );
    }
    return content;
  }
}
// I don't know why but I need to keep 'withRouter'
// if I want active NavLink
export default withRouter(
  withTracker((props) => {
    let isAdmin = Roles.userIsInRole(Meteor.userId(), ["admin"], "wp-veritas");
    let isEditor = Roles.userIsInRole(
      Meteor.userId(),
      ["tags-editor"],
      "wp-veritas"
    );
    let currentUser = Meteor.user();
    let isLoading = currentUser == undefined;

    return {
      isLoading: isLoading,
      isPrivatePage: true,
      currentUser: currentUser,
      currentUserIsAdmin: isAdmin,
      currentUserIsEditor: isEditor,
    };
  })(Header)
);
