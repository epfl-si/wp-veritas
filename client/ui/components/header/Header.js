import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from './Logo_EPFL.svg';

class Header extends Component {

  render() {
    let user = '';
    let content = '';
    if (this.props.currentUser !== undefined) {
        user = this.props.currentUser.username;
        content =  (
            <header className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
                  <Link className="navbar-brand" to="/"><img src={logo} className="App-logo" alt="logo"/></Link>
                
                  <div className="collapse navbar-collapse">
                      <ul className="navbar-nav mr-auto">
                          <li className="nav-item">
                              <NavLink exact className="nav-link" activeClassName="active" to="/">Voir la source de vérité</NavLink>
                          </li>
                          <li className="nav-item">
                              <NavLink className="nav-link" activeClassName="active" to="/add">Ajouter un nouveau site</NavLink>
                          </li>
                          <li className="nav-item">
                              <NavLink className="nav-link" activeClassName="active" to="/search">Recherche</NavLink>
                          </li>
                          <li className="nav-item">
                              <NavLink className="nav-link" activeClassName="active" to="/admin">Admin</NavLink>
                          </li>
                      </ul>
                      <ul className="navbar-nav ml-auto">
                          <li className="nav-item">
                            <div className="navbar-text">Utilisateur connecté <strong>{user}</strong></div>
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