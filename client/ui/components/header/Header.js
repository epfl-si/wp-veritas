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
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Source de vérité
                            </a>
                            <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                                <NavLink className="dropdown-item" to="/">Voir la source de vérité</NavLink>
                                <NavLink className="dropdown-item" to="/add">Ajouter un nouveau site</NavLink>
                            </div>
                        </li>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Tags
                            </a>
                            <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                                <NavLink className="dropdown-item" to="/tags">Gestion des tags</NavLink>
                            </div>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link"   to="/search">Instance WordPress ?</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/admin">Admin</NavLink>
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