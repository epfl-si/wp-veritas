import React, { Component } from "react";
import { Link, NavLink, withRouter } from "react-router-dom";
import { withTracker } from "meteor/react-meteor-data";
import logo from "./Logo_EPFL.svg";
import { Loading } from "../Messages";
import { version } from "../../../../package.json";
import { House, CirclePlus, BadgeInfo, Bookmark, Settings, Webhook } from "lucide-react";

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
      let versionURL = "https://github.com/epfl-si/wp-veritas/releases/tag/v" + version;
      let role = this.getRole();

      content = (
        <header className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <Link className="navbar-brand" to="/">
            <img src={logo} className="App-logo" alt="logo" />
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
              <li class="nav-item">
                <NavLink
                  className="nav-link"
                  exact
                  to="/"
                  activeClassName="active"
                >
                  <House size={12} />
                  &nbsp;Accueil
                </NavLink>
              </li>
              <li class="nav-item">
                <NavLink
                  to="/add"
                  className="nav-link"
                >
                  <CirclePlus size={12} />
                  &nbsp;Nouveau
                </NavLink>
              </li>
              <li class="nav-item">
                <NavLink
                  to="/search"
                  className="nav-link"
                >
                  <BadgeInfo size={12} />
                  &nbsp;Info
                </NavLink>
              </li>
              {this.props.currentUserIsAdmin ||
              this.props.currentUserIsEditor ? (
                <li class="nav-item">
                  <NavLink
                    to="/tags"
                    className="nav-link"
                  >
                    <Bookmark size={12} />
                    &nbsp;Tags
                  </NavLink>
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
                    activeClassName="active"
                  >
                    <Settings size={12} />
                    &nbsp;Gérer
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
                    <a className="dropdown-item" target="_blank" href={versionURL}>Version {version}</a>
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
                    <Webhook size={12} />
                    &nbsp;API
                  </a>
                  <div className="dropdown-menu">
                    <a className="dropdown-item" target="_blank" href="/api/index.html">Documentation de l'API</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/sites">Voir tous les sites</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/inventory/entries">Voir tous les sites (y.c. supprimés)</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/sites?platform_target=openshift-4">Voir les sites sur OpenShift 4</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/categories">Voir toutes les catégories</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/categories/WPForms/sites">Voir les sites avec WPForms</a>
                    <a className="dropdown-item" target="_blank" href="/api/v1/tags">Voir les tags</a>
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
