import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { useEffect } from 'react';
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
          <Route path="/" element={<Home />} />

          <Route path="/config" element={<Configuration />} />
        </Routes>
      </Router>
    </>
  );
}
