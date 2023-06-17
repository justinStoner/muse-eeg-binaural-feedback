import { get } from '@hungry-egg/rx-state';
import { Box, Grid, MenuItem, Select, Typography } from '@mui/material';
import { bandpassFilter, epoch, fft, sliceFFT } from '@neurosity/pipes';
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { channelNames } from 'muse-js';
import { zipSamples } from 'muse-js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Subject } from 'rxjs';
import { catchError, multicast, throttleTime } from 'rxjs/operators';

import {
  AUDIO_STATE,
  audioState$,
  brainwaveCoeffecients,
  contextStarted$,
  eegDebug$,
  eegStateReady$,
  feedbackMode$,
  LEFT_CHANNEL,
  leftChannel,
  leftNodes as leftNodes$,
  RIGHT_CHANNEL,
  rightChannel,
  rightNodes,
  showChart$,
  spectraSettings,
  startEEGNodes,
  subscribeAudio,
  unsubscribeAudio,
} from '../store';
import { useUnwrap } from '../store/audio';
import { getScaledValue } from '../utils';
import { emptyChannelData, generalOptions } from './chartOptions';
import CollapseCard from './ui/CollapseCard';
import SliderInput from './ui/SliderInput';
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  annotationPlugin,
  Filler,
  Title,
  Legend
);

const setNodeValues = (nodes, rampTime, channel, debug) => {
  nodes.forEach((nodeGroup, index) => {
    const [freq, gain, freqV, gainV, band, osc] = nodeGroup;
    if (channel === RIGHT_CHANNEL && debug) {
      console.log(
        `node: ${index} mute: ${
          band === 0
        } channel: ${channel} new freq: ${freqV} new gain: ${gainV} freq: ${
          freq.value
        } gain: ${gain.value}`
      );
    }
    if (band === 0 && !osc.mute) {
      osc.mute = true;
    } else {
      if (band > 0 && osc.mute) {
        osc.mute = false;
      }
      if (Math.ceil(freq.value) !== Math.ceil(freqV)) {
        freq.setRampPoint('+0');
        freq.rampTo(freqV, rampTime, 0);
      }
      if (
        gain.value < 0
          ? Math.floor(gain.value) !== Math.floor(gainV)
          : Math.ceil(gain.value) !== Math.ceil(gainV)
      ) {
        gain.setRampPoint('+0');
        gain.rampTo(gainV, rampTime, 0);
      }
    }
  });
};

const getNodes = (nodes, settings, bandCoeff, channelAvg) => {
  const { delta, theta, alpha, beta, gamma, dMax, tMax, aMax, bMax, gMax } =
    channelAvg;
  const max = Math.max(dMax, tMax, aMax, bMax, gMax);
  const amOsc = nodes.getAmEEG();
  const fmOsc = nodes.getFmEEG();
  const nodesAM = settings.useAM
    ? [
        [
          amOsc[0].frequency,
          amOsc[0].volume,
          delta,
          getScaledValue(
            dMax,
            0,
            max,
            -40,
            settings.modAmountAm * bandCoeff.delta * 5
          ),
          bandCoeff.delta,
          amOsc[0],
        ],
        [
          amOsc[1].frequency,
          amOsc[1].volume,
          theta,
          getScaledValue(
            tMax,
            0,
            max,
            -40,
            settings.modAmountAm * bandCoeff.theta * 5
          ),
          bandCoeff.theta,
          amOsc[1],
        ],
        [
          amOsc[2].frequency,
          amOsc[2].volume,
          alpha,
          getScaledValue(
            aMax,
            0,
            max,
            -40,
            settings.modAmountAm * bandCoeff.alpha * 5
          ),
          bandCoeff.alpha,
          amOsc[2],
        ],
        [
          nodes.amOsc[3].frequency,
          nodes.amOsc[3].volume,
          beta,
          getScaledValue(
            bMax,
            0,
            max,
            -40,
            settings.modAmountAm * bandCoeff.beta * 5
          ),
          bandCoeff.beta,
          amOsc[3],
        ],
        [
          amOsc[4].frequency,
          amOsc[4].volume,
          gamma,
          getScaledValue(
            gMax,
            0,
            max,
            -40,
            settings.modAmountAm * bandCoeff.gamma * 5
          ),
          bandCoeff.gamma,
          amOsc[4],
        ],
      ]
    : [];
  const nodesFM = settings.useFM
    ? [
        [
          fmOsc[0].frequency,
          fmOsc[0].volume,
          delta,
          getScaledValue(dMax, 0, max, 0, settings.modAmount * bandCoeff.delta),
          bandCoeff.delta,
          fmOsc[0],
        ],
        [
          fmOsc[1].frequency,
          fmOsc[1].volume,
          theta,
          getScaledValue(tMax, 0, max, 0, settings.modAmount * bandCoeff.theta),
          bandCoeff.theta,
          fmOsc[1],
        ],
        [
          fmOsc[2].frequency,
          fmOsc[2].volume,
          alpha,
          getScaledValue(aMax, 0, max, 0, settings.modAmount * bandCoeff.alpha),
          bandCoeff.alpha,
          fmOsc[2],
        ],
        [
          fmOsc[3].frequency,
          fmOsc[3].volume,
          beta,
          getScaledValue(bMax, 0, max, 0, settings.modAmount * bandCoeff.beta),
          bandCoeff.beta,
          fmOsc[3],
        ],
        [
          fmOsc[4].frequency,
          fmOsc[4].volume,
          gamma,
          getScaledValue(gMax, 0, max, 0, settings.modAmount * bandCoeff.gamma),
          bandCoeff.gamma,
          fmOsc[4],
        ],
      ]
    : [];
  return [...nodesAM, ...nodesFM];
};

export const updateNodes = ({ freqs, psd }) => {
  const eegDebug = get(eegDebug$);
  const nodes = get(rightNodes);
  const leftNodes = get(leftNodes$);
  const leftSettings = get(leftChannel.state);
  const rightSettings = get(rightChannel.state);
  const rampSeconds = get(spectraSettings.items.interval) / 1000 / 2;
  const bandCoeff = get(brainwaveCoeffecients.state);
  const mode = get(feedbackMode$);
  const rampTime = `+${rampSeconds}`;
  if (nodes && psd[3] && psd[3].length) {
    if (mode === 0) {
      setNodeValues(
        getNodes(
          nodes,
          rightSettings,
          bandCoeff,
          avgChannels(psd, freqs, eegDebug)
        ),
        rampTime,
        RIGHT_CHANNEL,
        eegDebug
      );
    } else {
      setNodeValues(
        getNodes(
          leftNodes,
          leftSettings,
          bandCoeff,
          avgChannels(mode === 1 ? [psd[2], psd[3]] : [psd[0], psd[1]], freqs)
        ),
        rampTime,
        LEFT_CHANNEL,
        eegDebug
      );

      setNodeValues(
        getNodes(
          nodes,
          rightSettings,
          bandCoeff,
          avgChannels(mode === 1 ? [psd[0], psd[1]] : [psd[2], psd[3]], freqs)
        ),
        rampTime,
        RIGHT_CHANNEL,
        eegDebug
      );
    }
  }
};

export function buildPipe() {
  if (window.subscriptionSpectra) window.subscriptionSpectra.unsubscribe();

  window.pipeSpectra$ = null;
  window.multicastSpectra$ = null;
  window.subscriptionSpectra = null;

  // Build Pipe
  const settings = get(spectraSettings.state);
  window.pipeSpectra$ = zipSamples(window.source.eegReadings$).pipe(
    bandpassFilter({
      cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
      nbChannels: window.nchans,
    }),
    epoch({
      duration: settings.duration,
      interval: settings.interval,
      samplingRate: settings.srate,
    }),
    throttleTime(get(spectraSettings.items.interval)),
    fft({ bins: settings.bins }),
    sliceFFT([settings.sliceFFTLow, settings.sliceFFTHigh]),
    catchError((err) => {
      console.log(err);
    })
  );

  window.multicastSpectra$ = window.pipeSpectra$.pipe(
    multicast(() => new Subject())
  );
}

export function setup(setData, Settings) {
  console.log('Subscribing to ' + Settings.name);

  if (window.multicastSpectra$) {
    window.subscriptionSpectra = window.multicastSpectra$.subscribe((data) => {
      if (get(showChart$)) {
        setData((spectraData) => {
          Object.values(spectraData).forEach((channel, index) => {
            channel.datasets[0].data = data.psd[index];
            channel.xLabels = data.freqs;
          });

          return {
            ch0: spectraData.ch0,
            ch1: spectraData.ch1,
            ch2: spectraData.ch2,
            ch3: spectraData.ch3,
            ch4: spectraData.ch4,
          };
        });
      }
    });

    window.multicastSpectra$.connect();
    console.log('Subscribed to ' + Settings.name);
  }
}

export const avgChannels = (psd, freqs, eegDebug) => {
  const deltas = [];
  const thetas = [];
  const alphas = [];
  const betas = [];
  const gammas = [];

  const dAmp = [];
  const tAmp = [];
  const aAmp = [];
  const bAmp = [];
  const gAmp = [];

  if (eegDebug) {
    return {
      delta: 2,
      theta: 6,
      alpha: 8,
      beta: 16,
      gamma: 30,
      dMax: 10,
      tMax: 10,
      aMax: 10,
      bMax: 10,
      gMax: 10,
    };
  }

  psd.forEach((ch) => {
    const delta = ch.slice(0, 4);
    const theta = ch.slice(3, 8);
    const alpha = ch.slice(3, 8);
    const beta = ch.slice(11, 30);
    const gamma = ch.slice(29, 36);

    const deltaFreqs = freqs.slice(0, 4);
    const thetaFreqs = freqs.slice(3, 8);
    const alphaFreqs = freqs.slice(7, 12);
    const betaFreqs = freqs.slice(11, 30);
    const gammaFreqs = freqs.slice(29, 36);

    const deltaMax = Math.max(...delta);
    const thetaMax = Math.max(...theta);
    const alphaMax = Math.max(...alpha);
    const betaMax = Math.max(...beta);
    const gammaMax = Math.max(...gamma);

    const deltaFreq = deltaFreqs[delta.indexOf(deltaMax)];
    const thetaFreq = thetaFreqs[theta.indexOf(thetaMax)];
    const alphaFreq = alphaFreqs[alpha.indexOf(alphaMax)];
    const betaFreq = betaFreqs[beta.indexOf(betaMax)];
    const gammaFreq = gammaFreqs[gamma.indexOf(gammaMax)];

    deltas.push(deltaFreq);
    thetas.push(thetaFreq);
    alphas.push(alphaFreq);
    betas.push(betaFreq);
    gammas.push(gammaFreq);

    dAmp.push(deltaMax);
    tAmp.push(thetaMax);
    aAmp.push(alphaMax);
    bAmp.push(betaMax);
    gAmp.push(gammaMax);
  });

  return {
    delta: deltas.reduce((a, b) => a + b, 0) / deltas.length,
    theta: thetas.reduce((a, b) => a + b, 0) / thetas.length,
    alpha: alphas.reduce((a, b) => a + b, 0) / alphas.length,
    beta: betas.reduce((a, b) => a + b, 0) / betas.length,
    gamma: gammas.reduce((a, b) => a + b, 0) / gammas.length,
    dMax: dAmp.reduce((a, b) => a + b, 0) / dAmp.length,
    tMax: tAmp.reduce((a, b) => a + b, 0) / tAmp.length,
    aMax: aAmp.reduce((a, b) => a + b, 0) / aAmp.length,
    bMax: bAmp.reduce((a, b) => a + b, 0) / bAmp.length,
    gMax: gAmp.reduce((a, b) => a + b, 0) / gAmp.length,
  };
};

function SpectraChart() {
  const eegStateReady = useUnwrap(eegStateReady$);
  const audioState = useUnwrap(audioState$);
  const contextStarted = useUnwrap(contextStarted$);
  const [data, setData] = useState(emptyChannelData);
  const settings = useUnwrap(spectraSettings.state);
  const showChart = useUnwrap(showChart$);
  const eegDebug = useUnwrap(eegDebug$);
  const setShowChart = (val) => showChart$.set(val);
  useEffect(() => {
    if (eegStateReady) {
      buildPipe(settings);
      setup(setData, settings);
      if (audioState === AUDIO_STATE.started && contextStarted) {
        startEEGNodes();
      }
    }
  }, [eegStateReady]);
  useEffect(() => {
    if (eegStateReady && audioState === AUDIO_STATE.started && contextStarted) {
      startEEGNodes();
    }
  }, [audioState, contextStarted]);
  let annotations = {};
  if (!showChart) {
    return (
      <>
        <CollapseCard
          show={showChart}
          setShow={setShowChart}
          title="EEG Output"
          cardProps={{ sx: { marginBottom: (theme) => theme.spacing(2) } }}
          contentProps={{
            paddingLeft: { xs: '0px', md: '16px' },
            paddingRight: { xs: '0px', md: '16px' },
          }}
        ></CollapseCard>
        <SpectraSliders
          setData={setData}
          status={eegStateReady}
          Settings={settings}
        />
      </>
    );
  } else {
    // const modAmount = get(rightChannel.items.modAmount$)
    // if (data.ch2.datasets[0].data) {
    //     const { delta, theta, alpha, beta, gamma} = avgChannels(data, modAmount)

    //     annotations = {
    //       delta: {
    //         type: 'line',
    //         xMin: delta - 1,
    //         xMax: delta - 1,
    //         borderColor: 'rgba(255, 255, 255, 0.6)',
    //         borderWidth: 2,

    //       },
    //       theta: {
    //           type: 'line',
    //           xMin: theta - 1,
    //           xMax: theta - 1,
    //           borderColor: 'rgba(255, 255, 255, 0.6)',
    //           borderWidth: 2,
    //       },
    //       alpha: {
    //           type: 'line',
    //           xMin: alpha - 1,
    //           xMax: alpha - 1,
    //           borderColor: 'rgba(255, 255, 255, 0.6)',
    //           borderWidth: 2,
    //       },
    //       beta: {
    //           type: 'line',
    //           xMin: beta - 1,
    //           xMax: beta - 1,
    //           borderColor: 'rgba(255, 255, 255, 0.6)',
    //           borderWidth: 2,
    //       },
    //       gamma: {
    //           type: 'line',
    //           xMin: gamma - 1,
    //           xMax: gamma - 1,
    //           borderColor: 'rgba(255, 255, 255, 0.6)',
    //           borderWidth: 2,
    //       }
    //   }

    // }

    const options = {
      ...generalOptions,
      scales: {
        x: {
          label: 'Frequency (Hz)',
          display: true,
          min: 1,
          max: settings.cutOffHigh,
          ticks: {
            color: '#fff',
          },
        },
        y: {
          label: 'Power (\u03BCV\u00B2)',
          // max: Math.max(vertLim, 10),
          min: 0,
          ticks: {
            color: '#fff',
          },
        },
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      title: {
        ...generalOptions.title,
        text: 'Spectra data from each electrode',
      },

      plugins: {
        legend: {
          display: true,
        },

        annotation: {
          annotations: {
            ...annotations,
            deltaRange: {
              type: 'box',
              xMin: 0,
              xMax: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0,
              label: {
                drawTime: 'afterDraw',
                display: true,
                content: 'Delta',
                color: '#fff',
                font: { size: 10, weight: 'normal' },
                position: {
                  x: 'center',
                  y: 'start',
                },
              },
            },
            thetaRange: {
              type: 'box',
              xMin: 3,
              xMax: 7,
              backgroundColor: 'rgba(255, 255, 255, 0)',
              borderWidth: 0,
              label: {
                drawTime: 'afterDraw',
                display: true,
                content: 'Theta',
                color: '#fff',
                font: { size: 10, weight: 'normal' },
                position: {
                  x: 'center',
                  y: 'start',
                },
              },
            },
            alphaRange: {
              type: 'box',
              xMin: 7,
              xMax: 11,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0,
              label: {
                drawTime: 'afterDraw',
                display: true,
                content: 'Alpha',
                color: '#fff',
                font: { size: 10, weight: 'normal' },
                position: {
                  x: 'center',
                  y: 'start',
                },
              },
            },
            betaRange: {
              type: 'box',
              xMin: 11,
              xMax: 29,
              backgroundColor: 'rgba(255, 255, 255, 0)',
              borderWidth: 0,
              label: {
                drawTime: 'afterDraw',
                display: true,
                content: 'Beta',
                color: '#fff',
                font: { size: 10, weight: 'normal' },
                position: {
                  x: 'center',
                  y: 'start',
                },
              },
            },
            gammaRange: {
              type: 'box',
              xMin: 29,

              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0,
              label: {
                drawTime: 'afterDraw',
                display: true,
                content: 'Gamma',
                color: '#fff',
                font: { size: 10, weight: 'normal' },
                position: {
                  x: 'center',
                  y: 'start',
                },
              },
            },
          },
        },
      },
    };
    const tension = 0.15;

    if (data.ch3.datasets[0].data) {
      const newData = {
        datasets: eegDebug
          ? [
              {
                label: channelNames[0],
                borderColor: 'rgb(217,95,2)',
                borderWidth: 1,
                data: data.ch0.xLabels.map((v) =>
                  v === 2 || v == 6 || v === 8 || v == 16 || v === 30 ? 10 : 0
                ),
                fill: false,
                tension,
              },
            ]
          : [
              {
                label: channelNames[0],
                borderColor: 'rgb(217,95,2)',
                borderWidth: 1,
                data: data.ch0.datasets[0].data,
                fill: false,
                tension,
              },
              {
                borderWidth: 1,
                label: channelNames[1],
                borderColor: 'rgb(27,158,119)',
                data: data.ch1.datasets[0].data,
                fill: true,
                tension,
              },
              {
                borderWidth: 1,
                label: channelNames[2],
                borderColor: 'rgb(117,112,179)',
                data: data.ch2.datasets[0].data,
                fill: false,
                tension,
              },
              {
                borderWidth: 1,
                label: channelNames[3],
                borderColor: 'rgb(231,41,138)',
                data: data.ch3.datasets[0].data,
                fill: false,
                tension,
              },
              {
                borderWidth: 1,
                label: 'FpZ',
                borderColor: 'rgb(41,170,231)',
                data: data.ch4.datasets[0].data,
                fill: false,
                tension,
              },
            ],
        labels: data.ch0.xLabels,
      };
      return (
        <>
          <CollapseCard
            title="EEG Output"
            cardProps={{ sx: { marginBottom: (theme) => theme.spacing(2) } }}
            contentProps={{
              paddingLeft: { xs: '0px', md: '16px' },
              paddingRight: { xs: '0px', md: '16px' },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                height: { xs: '46vw', md: 'auto' },
                width: { xs: '86vw', md: '100%' },
                margin: '0 auto',
              }}
            >
              <Line key={'Line_' + 1} data={newData} options={options} />
            </Box>
          </CollapseCard>
          <SpectraSliders
            setData={setData}
            status={eegStateReady}
            Settings={settings}
          />
        </>
      );
    } else {
      return (
        <>
          <CollapseCard
            title="EEG Output"
            cardProps={{ sx: { marginBottom: (theme) => theme.spacing(2) } }}
            contentProps={{
              paddingLeft: { xs: '0px', md: '16px' },
              paddingRight: { xs: '0px', md: '16px' },
            }}
          >
            <Typography variant="p">Connect EEG</Typography>
          </CollapseCard>
          <SpectraSliders
            setData={setData}
            status={eegStateReady}
            Settings={settings}
          />
        </>
      );
    }
  }
}

export function Spectra() {
  return <SpectraChart />;
}

export function SpectraSliders({ setData, status, Settings }) {
  function resetPipeSetup() {
    unsubscribeAudio();
    buildPipe(Settings);
    setup(setData, Settings);
    subscribeAudio();
  }

  function handleIntervalRangeSliderChange(e) {
    if (e.target.value && !Number.isNaN(Number(e.target.value))) {
      spectraSettings.items.interval.set(Number(e.target.value) * 1000);
      resetPipeSetup();
    }
  }

  const deltaC = useUnwrap(brainwaveCoeffecients.items$.delta);
  const thetaC = useUnwrap(brainwaveCoeffecients.items$.theta);
  const alphaC = useUnwrap(brainwaveCoeffecients.items$.alpha);
  const betaC = useUnwrap(brainwaveCoeffecients.items$.beta);
  const gammaC = useUnwrap(brainwaveCoeffecients.items$.gamma);
  const feedbackMode = useUnwrap(feedbackMode$);

  // function handleCutoffLowRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, cutOffLow: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleCutoffHighRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, cutOffHigh: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleSliceFFTLowRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, sliceFFTLow: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleSliceFFTHighRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, sliceFFTHigh: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleDurationRangeSliderChange(e, value) {
  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, duration: value}));
  //       resetPipeSetup();
  //   }
  // }

  // <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Epoch duration (Sampling Points): ' + Settings.duration}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={128} step={128} max={4096}
  //         label={'Epoch duration (Sampling Points): ' + Settings.duration}
  //         value={Settings.duration}
  //         onChange={handleDurationRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Cutoff Frequency Low: ' + Settings.cutOffLow + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={.01} step={.5} max={Settings.cutOffHigh - .5}
  //         label={'Cutoff Frequency Low: ' + Settings.cutOffLow + ' Hz'}
  //         value={Settings.cutOffLow}
  //         onChange={handleCutoffLowRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Cutoff Frequency High: ' + Settings.cutOffHigh + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={Settings.cutOffLow + .5} step={.5} max={Settings.srate/2}
  //         label={'Cutoff Frequency High: ' + Settings.cutOffHigh + ' Hz'}
  //         value={Settings.cutOffHigh}
  //         onChange={handleCutoffHighRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Slice FFT Lower limit: ' + Settings.sliceFFTLow + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={1} max={Settings.sliceFFTHigh - 1}
  //         label={'Slice FFT Lower limit: ' + Settings.sliceFFTLow + ' Hz'}
  //         value={Settings.sliceFFTLow}
  //         onChange={handleSliceFFTLowRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Slice FFT Upper limit: ' + Settings.sliceFFTHigh + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={Settings.sliceFFTLow + 1}
  //         label={'Slice FFT Upper limit: ' + Settings.sliceFFTHigh + ' Hz'}
  //         value={Settings.sliceFFTHigh}
  //         onChange={handleSliceFFTHighRangeSliderChange}
  //     />
  //     </Grid>

  return (
    <CollapseCard
      cardProps={{ sx: { marginBottom: (theme) => theme.spacing(2) } }}
      title="EEG feedback settings"
      spacing={2}
    >
      <SliderInput
        label="Feedback rate (seconds):"
        xs={12}
        value={Settings.interval / 1000}
        disabled={!status}
        inputWidth={70}
        spacing={2}
        range={{ step: 1, min: 1, max: 10 }}
        onChange={handleIntervalRangeSliderChange}
      />
      <Grid item xs={12}>
        <Typography
          gutterBottom
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          Mode
        </Typography>
        <Select
          value={`${feedbackMode}`}
          sx={{ maxWidth: 300 }}
          onChange={(e) => feedbackMode$.set(Number(e.target.value))}
        >
          <MenuItem value="0">
            left: constant tone <br></br> right: frequency modulation
          </MenuItem>
          <MenuItem value="1">
            left: frequency modulation from right brain <br></br> right:
            frequency modulation from left brain
          </MenuItem>
          <MenuItem value="2">
            left: frequency modulation from left brain <br></br> right:
            frequency modulation from right brain
          </MenuItem>
        </Select>
      </Grid>
      <SliderInput
        label="Delta intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(deltaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.delta.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
      <SliderInput
        label="Theta intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(thetaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.theta.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
      <SliderInput
        label="Alpha intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(alphaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.alpha.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
      <SliderInput
        label="Beta intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(betaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.beta.set(Number(e.target.value) / 100);
          }
        }}
      />
      <SliderInput
        label="Gamma intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(gammaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.gamma.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
    </CollapseCard>
  );
}
