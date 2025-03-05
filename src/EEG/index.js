import { get } from '@hungry-egg/rx-state';
import { bandpassFilter, epoch, fft, sliceFFT } from '@neurosity/pipes';
import { zipSamples } from 'muse-js';
import { Subject } from 'rxjs';
import { catchError, multicast, throttleTime } from 'rxjs/operators';

import { showChart$, spectraSettings } from '../store';

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
