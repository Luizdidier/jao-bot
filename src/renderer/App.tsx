import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import jaoIcon from './assets/jao.png';
import { Grid } from '@mui/material';
import Home from './app/Home';
import Configuration from './app/Configuration';

export default function App() {
  return (
    <>
      <Grid container justifyContent="flex-start" alignItems="center">
        <img src={jaoIcon} alt="Ícone" className="app-icon" width="200" />
      </Grid>
      <Router>
        <Routes>
          <Route path="/" element={<Configuration />} />

          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}
