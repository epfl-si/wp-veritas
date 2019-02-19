import React from 'react';
import { Header, Footer, Add, List, Admin, Search, Tag, SiteTags } from './components'; 
import { BrowserRouter as Router, Route } from 'react-router-dom';

export default class Apps extends React.Component {
  render() {
    return (
      <Router>
        <div className="App container">
          <Header  />
          <Route exact path="/" component={ List } />
          <Route exact path="/add" component={ Add } />
          <Route path="/edit/:_id" component={ Add } />
          <Route path="/tags" component={ Tag }/>
          <Route path="/tag/:_id" component={ Tag }/>

          <Route path="/site-tags/:_id" component={ SiteTags }/>
          <Route exact path="/search" component={ Search } />
          <Route exact path="/admin" component={ Admin } />
          <Footer />
        </div>
      </Router>
    )
  }
}
