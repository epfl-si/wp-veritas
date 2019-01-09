import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from './Logo_EPFL.svg';

export default class Header extends Component {

  render() {
    return (
      <header className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
            <Link className="navbar-brand" to="/"><img src={logo} className="App-logo" alt="logo"/></Link>
            <button className="navbar-toggler">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse">
                <ul className="navbar-nav ml-auto">
                    <li className="nav-item">
                        <NavLink className="nav-link" activeClassName="active" to="/list">Voir la source de vérité</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link" activeClassName="active" to="/add">Ajouter un nouveau site</NavLink>
                    </li>
                </ul>
            </div>
        </header>
    );
  }

}