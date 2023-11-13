import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import '../../App.css';
import { useEffect, useState } from 'react';
import { Grid, CircularProgress } from '@mui/material';

function Home({ qr }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const filePathCache = localStorage.getItem('filePath');

  useEffect(() => {
    const handleFileData = (_event: any) => {
      console.log(_event);
    };

    const handleQrData = (qrCodeDataURL: any) => {
      try {
        setIsLoading(false);
        console.log('Chamou 1');
        const img = document.getElementById('qrCode') as HTMLImageElement;
        if (qrCodeDataURL) {
          console.log('Chamou 2 : ', qrCodeDataURL);
          img.style.display = 'block';
          img.src = qrCodeDataURL as string;
        } else {
          img.style.display = 'none';
        }
      } catch (err) {
        console.log(err);
      }
    };

    if (filePathCache) {
      window.electron.ipcRenderer.on('file-data', handleFileData);
      window.electron.ipcRenderer.sendMessage('load-excel-file', filePathCache);
      window.electron.ipcRenderer.on('qr', handleQrData);
    } else {
      navigate('/config');
    }
  }, []);

  return (
    <div>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        {isLoading && <CircularProgress />}

        <img id="qrCode" alt="QR Code" style={{ display: 'none' }} />
      </Grid>
    </div>
  );
}

export default Home;
