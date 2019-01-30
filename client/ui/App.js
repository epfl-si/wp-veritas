import React from 'react';
import { Header, Footer, Add, List, Admin } from './components'; 
import { BrowserRouter as Router, Route } from 'react-router-dom';



class App extends React.Component {

  render() {
    return (
      <Router>
        <div className="App container">
          <Header />
          <Route exact path="/" component={ List } />
          <Route exact path="/add" component={ Add } />
          <Route path="/edit/:_id" component={ Add } />
          <Route exact path="/admin" component={ Admin } />
          <Footer />
        </div>
      </Router>
    )
  }
}

export default App;
