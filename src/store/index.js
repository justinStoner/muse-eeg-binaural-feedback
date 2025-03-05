import { atom, combine, get } from '@hungry-egg/rx-state';
import { skip } from 'rxjs/operators';
import { start } from 'tone';

const LEFT_CHANNEL = -1;
const RIGHT_CHANNEL = 1;

import { updateNodes } from '../EEG/audio';
import BinauralSynth from '../synth/binaural';
import NoiseSynth from '../synth/noise';
import { AudioNodes, defaultPreset, NoiseChannel, SynthChannel } from './audio';

const leftChannel = SynthChannel({
  freq: 144,
  modFreq: 7.51,
  modFreqAm: 7.51,
  type: 'sine',
  modType: 'sine',
  modTypeAm: 'sine',
  modAmount: 14,
  modAmountAm: -10,
  volume: 0,
  useAM: false,
  useFM: true,
});

const rightChannel = SynthChannel({
  freq: 151.51,
  modFreq: 7.51,
  modFreqAm: 7.51,
  type: 'sine',
  modType: 'sine',
  modTypeAm: 'sine',
  modAmount: 14,
  modAmountAm: -10,
  volume: 0,
  useAM: false,
  useFM: true,
});

const noise = NoiseChannel({
  on: false,
  volume: -36,
  speed: 1,

  lfo1Freq: 0.1,
  lfo1Min: 350,
  lfo1Max: 1350,
  lfo1Phase: 0,
  lfo2Freq: 0.15,
  lfo2Min: 1000,
  lfo2Max: 2000,
  lfo2Phase: 0,
  lfo3Freq: 0.05,
  lfo3Min: 350,
  lfo3Max: 2000,
  lfo3Phase: 180,

  filter1Q: 1,
  filter1Gain: 0.75,

  filter2Q: 1,
  filter2Gain: 0.75,

  filter3Q: 1,
  filter3Gain: 0.75,

  chorusDelay: 200,
  chorusFeedback: 0,
  chorusDepth: 0.5,
  chorusFreq: 0.05,
  chorusSpread: 90,

  reverbDecay: 6,
  reverbWet: 1,
});

const AUDIO_STATE = {
  stopped: 'Stopped',
  started: 'Started',
};

const showUpdateNotification$ = atom(false);

// TODO changing back to 0
const feedbackMode$ = atom(0);

const audioState$ = atom(AUDIO_STATE.stopped);
const contextStarted$ = atom(false);

const outputVisual$ = atom(false);

const SpectraSettings = ({
  cutOffLow = 1,
  cutOffHigh = 35,
  interval = 2000,
  bins = 256,
  sliceFFTLow = 1,
  sliceFFTHigh = 35,
  duration = 256,
  srate = 256,
  name = 'Spectra',
  secondsToSave = 10,
}) => {
  const cutOffLow$ = atom(cutOffLow);
  const cutOffHigh$ = atom(cutOffHigh);
  const interval$ = atom(interval);
  const bins$ = atom(bins);
  const sliceFFTLow$ = atom(sliceFFTLow);
  const sliceFFTHigh$ = atom(sliceFFTHigh);
  const duration$ = atom(duration);
  const srate$ = atom(srate);
  const name$ = atom(name);
  const secondsToSave$ = atom(secondsToSave);
  return {
    state: combine({
      cutOffLow: cutOffLow$,
      cutOffHigh: cutOffHigh$,
      interval: interval$,
      bins: bins$,
      sliceFFTLow: sliceFFTLow$,
      sliceFFTHigh: sliceFFTHigh$,
      duration: duration$,
      srate: srate$,
      name: name$,
      secondsToSave: secondsToSave$,
    }),
    items: {
      cutOffLow: cutOffLow$,
      cutOffHigh: cutOffHigh$,
      interval: interval$,
      bins: bins$,
      sliceFFTLow: sliceFFTLow$,
      sliceFFTHigh: sliceFFTHigh$,
      duration: duration$,
      srate: srate$,
      name: name$,
      secondsToSave: secondsToSave$,
    },
  };
};

const leftNodes = AudioNodes(null);
const rightNodes = AudioNodes(null);
const noiseNodes = AudioNodes(null);

const brainwaveCfx = {
  delta: atom(0.4),
  theta: atom(1),
  alpha: atom(0.4),
  beta: atom(0.2),
  gamma: atom(0.2),
};

const brainwaveCoeffecients = {
  state: combine(brainwaveCfx),
  items$: brainwaveCfx,
};

const setupPresets = (preset, channelL, channelR) => {
  preset.selectedPreset$.pipe(skip(1)).subscribe((v) => {
    if (v > -1) {
      const newPreset = get(preset.presets$)[v];
      channelL.useAM$.set(newPreset.left.useAM);
      channelL.useFM$.set(newPreset.left.useFM);
      channelL.modFreq$.set(newPreset.left.modFreq);
      channelL.modFreqAm$.set(newPreset.left.modFreqAm);
      channelL.modAmount$.set(newPreset.left.modAmount);
      channelL.modAmountAm$.set(newPreset.left.modAmountAm);
      channelL.freq$.set(newPreset.left.freq);
      channelL.volume$.set(newPreset.left.volume);

      channelR.useAM$.set(newPreset.right.useAM);
      channelR.useFM$.set(newPreset.right.useFM);
      channelR.modFreq$.set(newPreset.right.modFreq);
      channelR.modFreqAm$.set(newPreset.right.modFreqAm);
      channelR.modAmount$.set(newPreset.right.modAmount);
      channelR.modAmountAm$.set(newPreset.right.modAmountAm);
      channelR.freq$.set(newPreset.right.freq);
      channelR.volume$.set(newPreset.right.volume);
    }
  });
};

const createContext = () => {
  return start();
};

const bootstrapAudio = () => {
  BinauralSynth.init();

  setupPresets(defaultPreset, leftChannel.items, rightChannel.items);

  NoiseSynth({
    settings: noise.state,
  }).initNoise();
};

const startNodes = () => {
  const n = get(noiseNodes);
  const ns = get(noise.state);

  if (ns.on) {
    n.start();
  }

  BinauralSynth.start();
};

const startEEGNodes = () => {
  const right = get(rightNodes);
  const rightSettings = get(rightChannel.state);
  const left = get(leftNodes);
  const leftSettings = get(leftChannel.state);
  const mode = get(feedbackMode$);
  if (rightSettings.useFM) {
    right.startFmEEG();
    right.stopFm();
  }
  if (rightSettings.useAM) {
    right.startAmEEG();
    right.stopAm();
  }
  if (mode > 0) {
    if (leftSettings.useFM) {
      left.startFmEEG();
      left.stopAm();
    }
    if (leftSettings.useAM) {
      left.startAmEEG();
      left.stopAm();
    }
  }

  subscribeAudio();
};

const unsubscribeAudio = () => {
  if (window.audioSpectra) {
    window.audioSpectra.unsubscribe();
    window.audioSpectra = null;
  }
};
const subscribeAudio = () => {
  if (window.multicastSpectra$) {
    window.audioSpectra = window.multicastSpectra$.subscribe((data) => {
      updateNodes(data);
    });
  }
};

const stopNodes = () => {
  const left = get(leftNodes);
  const right = get(rightNodes);
  const n = get(noiseNodes);

  left.synth.triggerRelease('+0.5');
  right.synth.triggerRelease('+0.5');

  n.stop();
};

const eegStateReady$ = atom(false);
const eegDebug$ = atom(false);

const spectraSettings = SpectraSettings({});
const showChart$ = atom(false);
export {
  AUDIO_STATE,
  audioState$,
  bootstrapAudio,
  brainwaveCoeffecients,
  contextStarted$,
  createContext,
  eegDebug$,
  eegStateReady$,
  feedbackMode$,
  LEFT_CHANNEL,
  leftChannel,
  leftNodes,
  noise,
  noiseNodes,
  outputVisual$,
  RIGHT_CHANNEL,
  rightChannel,
  rightNodes,
  showChart$,
  showUpdateNotification$,
  spectraSettings,
  startEEGNodes,
  startNodes,
  stopNodes,
  subscribeAudio,
  unsubscribeAudio,
};
