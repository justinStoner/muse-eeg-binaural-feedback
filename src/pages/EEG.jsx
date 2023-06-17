import { get } from '@hungry-egg/rx-state';
import {
  AppBar,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Link,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { MuseClient } from 'muse-js';
import { useEffect, useState } from 'react';

import AudioSettings from '../components/AudioSettings';
import { Spectra } from '../components/Spectra';
import {
  AUDIO_STATE,
  audioState$,
  bootstrapAudio,
  contextStarted$,
  createContext,
  eegDebug$,
  eegStateReady$,
  rightNodes,
  startNodes,
  stopNodes,
  unsubscribeAudio,
} from '../store';
import { useUnwrap } from '../store/audio';
import { mockMuseEEG } from '../utils/mockMuseEEG';

export function EEG() {
  window.enableAux = true;
  window.nchans = 5;

  // connection status
  const [status, setStatus] = useState('Connect');
  const audioState = useUnwrap(audioState$);
  const contextStarted = useUnwrap(contextStarted$);
  const eegDebug = useUnwrap(eegDebug$);

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (audioState === AUDIO_STATE.started) {
      if (!contextStarted) {
        createContext().then(() => {
          bootstrapAudio();
          startNodes();
          contextStarted$.set(true);
        });
      } else {
        startNodes();
      }
    } else {
      if (get(rightNodes)) {
        stopNodes();
        unsubscribeAudio();
      }
    }
  }, [audioState]);

  async function connect() {
    try {
      if (window.debugWithMock) {
        // Debug with Mock EEG Data
        setStatus('Connecting');
        window.source = {};
        window.source.connectionStatus = {};
        window.source.connectionStatus.value = true;
        window.source.eegReadings$ = mockMuseEEG(256);
        setStatus('Connected');
        if (
          window.source.connectionStatus.value === true &&
          window.source.eegReadings$
        ) {
          eegStateReady$.set(true);
        }
      } else {
        // Connect with the Muse EEG Client
        setStatus('Connecting');
        window.source = new MuseClient();
        window.source.enableAux = true;
        await window.source.connect();
        await window.source.start();
        window.source.eegReadings$ = window.source.eegReadings;
        setStatus('Connected');
        if (
          window.source.connectionStatus.value === true &&
          window.source.eegReadings$
        ) {
          eegStateReady$.set(true);
        }
      }
    } catch (err) {
      setStatus('Error');
      console.error(err);
      console.log('Connection error: ' + err);
    }
  }

  function refreshPage() {
    window.location.reload();
  }

  // Render the entire page using above functions
  return (
    <>
      <AppBar position="static" enableColorOnDark color="contrast">
        <Toolbar>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ flex: 1 }}
          >
            <Button
              variant="contained"
              size="small"
              sx={{
                fontSize: [9, 13],
                paddingX: { xs: '6px', md: '10px' },
                paddingY: { xs: '2px', md: '4px' },
              }}
              color={audioState === AUDIO_STATE.stopped ? 'primary' : 'error'}
              onClick={() => {
                audioState$.set(
                  audioState === AUDIO_STATE.stopped
                    ? AUDIO_STATE.started
                    : AUDIO_STATE.stopped
                );
              }}
            >
              {audioState === AUDIO_STATE.stopped
                ? 'Start audio'
                : 'Stop audio'}
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{
                fontSize: [9, 13],
                paddingX: { xs: '6px', md: '10px' },
                paddingY: { xs: '2px', md: '4px' },
              }}
              disabled={status !== 'Connect'}
              onClick={() => {
                window.debugWithMock = false;
                connect();
              }}
            >
              {status === 'Connect' ? 'Connect EEG' : status}
            </Button>
            {process.env.NODE_ENV === 'development' ? (
              <Button
                size="small"
                variant="contained"
                sx={{
                  fontSize: [9, 13],
                  paddingX: { xs: '6px', md: '10px' },
                  paddingY: { xs: '2px', md: '4px' },
                }}
                disabled={status !== 'Connect'}
                onClick={() => {
                  window.debugWithMock = true;
                  connect();
                }}
              >
                {status === 'Connect' ? 'Connect Mock' : status}
              </Button>
            ) : null}
            {process.env.NODE_ENV === 'development' ? (
              <Button
                size="small"
                variant="contained"
                sx={{
                  fontSize: [9, 13],
                  paddingX: { xs: '6px', md: '10px' },
                  paddingY: { xs: '2px', md: '4px' },
                }}
                onClick={() => {
                  eegDebug$.set(true);
                }}
              >
                {!eegDebug ? 'Debug EEG' : 'Stop debug'}
              </Button>
            ) : null}
            <Button
              size="small"
              sx={{
                fontSize: [9, 13],
                paddingX: { xs: '6px', md: '10px' },
                paddingY: { xs: '2px', md: '4px' },
              }}
              variant="contained"
              onClick={refreshPage}
              color="error"
              disabled={status === 'Connect'}
            >
              Disconnect
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container sx={{ paddingTop: (theme) => theme.spacing(2) }}>
        <Spectra />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <AudioSettings />
          </Grid>
        </Grid>
        <Button
          sx={{ marginTop: 2, marginBottom: 2 }}
          variant="text"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          About
        </Button>
        <Dialog
          open={dialogOpen}
          scroll="paper"
          onClose={() => {
            setDialogOpen(false);
          }}
        >
          <DialogTitle>About</DialogTitle>
          <DialogContent dividers>
            <DialogContentText tabIndex={-1}>
              <Typography variant="body1">
                Pressing start audio will start playing basic binaural beats.
              </Typography>
              <Typography variant="body2" mt={1} mb={2} pl={2}>
                Under audio settings, you can change the paramaters of the audio
                synthesis for each channel.
              </Typography>
              <Typography variant="body1">
                Clicking connect will pair with a bluetooth EEG headset.
              </Typography>
              <Typography variant="body2" mt={1} pl={2}>
                The right audio channel will then play back a sonified
                representation of your brainwaves. Try to sync them with the
                frequency playing from the left channel.
              </Typography>
              <Typography variant="subtitle2" mt={1} mb={2} pl={2}>
                Currently only supports muse
              </Typography>
              <Typography variant="body1">
                The eeg implementation was inspired by:{' '}
                <Link target="_blank" href="http://jackhouck.com/maw.shtml">
                  This theory from Jack Houck
                </Link>
                .
              </Typography>
              <Typography variant="body2" mt={1} pl={2}>
                The default modulation frequencies are set to 7.51hz, as the
                author linked above had some success with it.
              </Typography>
              <Typography variant="body2" mt={1} mb={2} pl={2}>
                This value he calculated to be the primary Schumann resonance
                oscillation in the 80&apos;s. You can find the current value{' '}
                <Link target="_blank" href="http://sosrff.tsu.ru/?page_id=9">
                  here
                </Link>
              </Typography>
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
}
