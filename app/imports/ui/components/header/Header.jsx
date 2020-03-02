import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from './Logo_EPFL.svg';
import { Loading } from '../Messages';

class Header extends Component {
  isLoading = () => {
    return this.props.currentUser === undefined;
  }
  render() {
    let content;

    if (this.isLoading()) {
      content = <Loading />;
    } else {

      let isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin', Roles.GLOBAL_GROUP);
      let isTagsEditor = Roles.userIsInRole(Meteor.userId(), 'tags-editor', Roles.GLOBAL_GROUP);

      content =  (
        <header className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <Link className="navbar-brand" to="/"><img src={logo} className="App-logo" alt="logo"/></Link>           
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
              { isAdmin || isTagsEditor ?
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Source de vérité
                </a>
                <div className="dropdown-menu" >
                  <NavLink className="dropdown-item" to="/">Voir la source de vérité</NavLink>
                  { isAdmin ?
                    <NavLink className="dropdown-item   " to="/add">Ajouter un nouveau site</NavLink>
                  : null} 
                </div>
              </li>
              : null}
              { isAdmin || isTagsEditor ?
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Tags
                </a>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <NavLink className="dropdown-item" to="/tags">Gestion des tags</NavLink>
                </div>
              </li>
              : null}
              { isAdmin || isTagsEditor ?
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Professeurs
                </a>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <NavLink className="dropdown-item" to="/professors">Gestion des professeurs</NavLink>
                </div>
              </li>
              : null}
              <li className="nav-item">
                <NavLink className="nav-link" to="/search">Instance WordPress ?</NavLink>
              </li>
              { isAdmin ?   
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Admin
                </a>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <NavLink className="nav-link" to="/admin">Admin</NavLink>
                  <NavLink className="nav-link" to="/admin/log/list">Voir les logs</NavLink>
                  <div className="nav-link">Version 1.1.4</div>
                </div>
              </li>
              : null}
            </ul>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <div className="navbar-text">Utilisateur connecté <strong>{ this.props.currentUser.username }</strong></div>
              </li>
            </ul>
          </div>
        </header>
      )
    }
    return content;
  }
}
export default withTracker(() => {
  return {
    currentUser: Meteor.user(),
  };
})(Header);