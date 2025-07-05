import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import DivisionManager from './pages/DivisionManager';
import DivisionTournament from './pages/DivisionTournament';
import Home from './pages/Home';
import MatchDetails from './pages/MatchDetails';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={DivisionManager} />
        <Route path="/division/:divisionId" component={DivisionTournament} />
        <Route path="/legacy" component={Home} />
        <Route path="/match/:id" component={MatchDetails} />
      </Switch>
    </Router>
  );
};

export default App;