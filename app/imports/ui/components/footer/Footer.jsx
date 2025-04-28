import React from 'react';
var pjson = require('/package.json');

export const Footer = () => (
  <footer className="small border-top">
      <div className="footer-copyright text-center py-3">Coded by
          &nbsp;<a href="https://go.epfl.ch/fsd">ISAS-FSD</a>
          &nbsp;&mdash;&nbsp;<a href="https://github.com/epfl-si/wp-veritas">sources</a>
          &nbsp;&mdash;&nbsp;v{pjson.version}
      </div>
  </footer>
)
