import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: 'white',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white', // Cor da borda no hover
          },
        },
        notchedOutline: {
          borderColor: 'white',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'white',
        },
      },
    },
  },
});

const Configuration: React.FC = () => {
  const [filePath, setFilePath] = useState('');
  const navigate = useNavigate();

  const handleSave = () => {
    window.electron.ipcRenderer.sendMessage('save-filePath', filePath);
    localStorage.setItem('filePath', filePath)
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h1>Configuração</h1>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Path do Arquivo"
              variant="outlined"
              fullWidth
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Salvar
            </Button>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Configuration;
