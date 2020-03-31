import React, { Component } from 'react';
import { Link, NavLink, withRouter} from 'react-router-dom';
import { withTracker } from 'meteor/react-meteor-data';
import logo from './Logo_EPFL.svg';

class Header extends Component {
  render() {
    let content;
    if (this.props.currentUser === undefined) { 
      content = <Loading />
    } else { 
      let isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin', Roles.GLOBAL_GROUP);
      let isTagsEditor = Roles.userIsInRole(Meteor.userId(), 'tags-editor', Roles.GLOBAL_GROUP);
      let peopleUrl = "https://people.epfl.ch/" + this.props.currentUser.profile.sciper;
      content = (
        <header className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <Link className="navbar-brand" to="/"><img src={logo} className="App-logo" alt="logo"/></Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Source de vérité
                </a>
                <div className="dropdown-menu" >
                  { isAdmin || isTagsEditor ?
                  <NavLink className="dropdown-item" exact to="/" activeClassName="active">Voir la source de vérité</NavLink>
                  : null}
                  <NavLink className="dropdown-item" to="/search" activeClassName="active">Instance WordPress ?</NavLink>
                  { isAdmin ?
                  <NavLink className="dropdown-item" to="/add" activeClassName="active">Ajouter un nouveau site</NavLink>
                  : null}
                </div>
              </li>
              { isAdmin || isTagsEditor ?
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Tags
                </a>
                <div className="dropdown-menu" >
                  <NavLink className="dropdown-item" to="/tags" activeClassName="active">Gestion des tags</NavLink>
                </div>
              </li>
              : null}
              { isAdmin || isTagsEditor ?
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Professeurs
                </a>
                <div className="dropdown-menu">
                  <NavLink className="dropdown-item" to="/professors" activeClassName="active">Gestion des professeurs</NavLink>
                </div>
              </li>
              : null}
              { isAdmin ?
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Admins
                </a>
                <div className="dropdown-menu">
                  <NavLink className="dropdown-item" exact to="/admin" activeClassName="active">Admin</NavLink>
                  <NavLink className="dropdown-item" to="/admin/log/list" activeClassName="active">Voir les logs</NavLink>
                  <div className="dropdown-item">Version 1.3.10</div>
                </div>
              </li>
              : null}
            </ul>
          </div>
          <div className="userMenu">
            <div>
              <span className="navbar-text">Utilisateur:</span>&nbsp;
              <a target="_blank" href={ peopleUrl }>{ this.props.currentUser.username }</a>
            </div>
          </div>
        </header>
      )
    }
    return content;
  }
}
// I don't know why but I need to keep 'withRouter'
// if I want active NavLink
export default withRouter(withTracker(() => {
  return {
    currentUser: Meteor.user(),
  };
})(Header));