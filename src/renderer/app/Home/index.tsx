import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import '../../App.css';
import { useEffect, useState } from 'react';
import { Grid, CircularProgress, Button } from '@mui/material';

function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [sendLoading, setSendLoading] = useState('NOT_SEND');
  const navigate = useNavigate();
  const filePathCache = localStorage.getItem('filePath');

  const handleQrData = (qrCodeDataURL: any) => {
    try {
      console.log('Have QR');
      const img = document.getElementById('qrCode') as HTMLImageElement;
      if (qrCodeDataURL) {
        img.style.display = 'block';
        img.src = qrCodeDataURL as string;
      } else {
        img.style.display = 'none';
      }
      setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  window.electron.ipcRenderer.on('loadingSend', (arg) => {
    console.log(arg);
    if (arg === 'INIT_SEND') {
      setSendLoading(arg);
    }

    if (arg === 'END_SEND') {
      setSendLoading(arg);
      setShowButton(true);
    }
  });

  useEffect(() => {
    const handleFileData = (_event: any) => {
      console.log(_event);
    };

    if (filePathCache) {
      window.electron.ipcRenderer.on('file-data', handleFileData);
      window.electron.ipcRenderer.sendMessage('load-excel-file', filePathCache);
    } else {
      navigate('/config');
    }
  }, []);

  const handleQrCode = () => {
    setIsLoading(true);
    window.electron.ipcRenderer.on('qr', handleQrData);
    setShowButton(false);
  };

  return (
    <div>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        {isLoading && <CircularProgress />}
        {!isLoading && showButton && (
          <Button onClick={handleQrCode} variant="contained" color="primary">
            Chamar QR Code
          </Button>
        )}

        {sendLoading !== 'NOT_SEND' && sendLoading !== 'END_SEND' && (
          <CircularProgress />
        )}

        {sendLoading === 'NOT_SEND' && (
          <img id="qrCode" alt="QR Code" style={{ display: 'none' }} />
        )}
      </Grid>
    </div>
  );
}

export default Home;
