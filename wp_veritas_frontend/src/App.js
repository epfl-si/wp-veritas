import React from 'react';
import { Header, Footer, Add, List } from './components/'; 
import { BrowserRouter as Router, Route } from 'react-router-dom';

const Homepage = () => {
  return (
    <div className="container">
      <h2 className="p-4">Vous devez être authentifiés (Tequila)</h2>
    </div>
  )
}

class App extends React.Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Header />
          <Route exact path="/" component={ Homepage } />
          <Route path="/add-new-wp-site" component={ Add } />
          <Route path="/update-wp-site/:id" component={ Add } />
          <Route path="/list" component={ List } />
          <Footer />
        </div>
      </Router>
    )
  }
}

export default App;
