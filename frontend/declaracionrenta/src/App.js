import React, { Component } from 'react';
import Loadable from 'react-loadable'
import { Layout } from 'antd';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from 'react-router-dom';
import './App.css';

import Header from './components/Header';
import Loader from './components/Loading';
// import ConjuntosPage from './pages/Conjuntos';

const ConjuntosLoadable = Loadable({
  loader: () => import('./pages/Conjuntos'),
  loading: Loader
})

class App extends Component {
  render() {
    return (
      <Layout className="App">
        <Header />
        <Router>
          <Switch>
            <Route exact path="/conjuntos" component={ConjuntosLoadable} />
            <Route exact path="/conjuntos/:tab" component={ConjuntosLoadable} />
            <Route exact path="/conjuntos/:tab/:crud" component={ConjuntosLoadable} />
            <Redirect from="/" to="/conjuntos" />
            <Route component={(props) => {
              return <h1>Not found</h1>
            }} />
          </Switch>
        </Router>
      </Layout>
    );
  }
}

export default App;
