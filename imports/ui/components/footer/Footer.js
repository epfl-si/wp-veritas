import React, { Component } from 'react';

export default class Footer extends Component {
  render() {
    return (
        <footer className="small border-top">
            <div className="footer-copyright text-center py-3">© 2019 Copyright 
                <a href="https://www.epfl.ch"> EPFL</a>
            </div>
        </footer>
    );
  }
}