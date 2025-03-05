import { Box, Typography } from '@mui/material';
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
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { buildPipe, setup } from '../EEG';
import {
  AUDIO_STATE,
  audioState$,
  contextStarted$,
  eegDebug$,
  eegStateReady$,
  showChart$,
  spectraSettings,
  startEEGNodes,
} from '../store';
import { useUnwrap } from '../store/audio';
import { emptyChannelData, generalOptions } from './chartOptions';
import { SpectraSliders } from './Spectra/Settings';
import CollapseCard from './ui/CollapseCard';
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
