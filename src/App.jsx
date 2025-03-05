import { Box, Button, CssBaseline, Snackbar } from '@mui/material';
import { brown, grey } from '@mui/material/colors';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { EEG } from './pages/EEG';
import { showUpdateNotification$ } from './store';
import { useUnwrap } from './store/audio';

const handleClose = (event, reason) => {
  if (reason === 'clickaway') {
    return;
  }

  window.location.reload();
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    contrast: {
      main: brown[900],
    },
    background: {
      paper: grey[900],
    },
  },
});
function App() {
  const showUpdateNotification = useUnwrap(showUpdateNotification$);
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <EEG />
        <Snackbar
          open={showUpdateNotification}
          autoHideDuration={6000}
          message="Reload to update"
          onClose={handleClose}
          action={
            <>
              <Button color="secondary" size="small" onClick={handleClose}>
                Update
              </Button>
            </>
          }
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
