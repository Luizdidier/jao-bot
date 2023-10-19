import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { useEffect } from 'react';
import { ipcRenderer } from 'electron';

function Hello({ qr }: any) {
  useEffect(() => {
    window.electron.ipcRenderer.on('qr', (qrCodeDataURL) => {
      // Mostre qrCodeDataURL como uma imagem no React
      const img = document.getElementById('qrCode') as HTMLImageElement;
      img.src = qrCodeDataURL as string;
    });
  }, []);

  return (
    <div>
      <h1>Scan QR Code</h1>
      <img id="qrCode" alt="QR Code" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
