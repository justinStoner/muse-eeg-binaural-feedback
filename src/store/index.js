import { atom, combine, get } from '@hungry-egg/rx-state';
import { skip } from 'rxjs/operators';
import {
  Analyser,
  Channel,
  Filter,
  LFO,
  Noise,
  Oscillator,
  start,
  Synth,
  Transport,
} from 'tone';

const LEFT_CHANNEL = -1;
const RIGHT_CHANNEL = 1;

import { updateNodes } from '../components/Spectra';
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
  volume: -5,
  speed: 1,
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
const SpectraSettings = ({
  cutOffLow = 1,
  cutOffHigh = 35,
  interval = 1000,
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

const setupSynth = (channel, nodes, channelMode) => {
  channel.freq$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.synth.frequency.rampTo(v, 0, '+0');
    }
  });
  channel.modFreq$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.fmOsc[0].frequency.rampTo(v, 0.5, '+0');
    }
  });
  channel.modFreqAm$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.amOsc[0].frequency.rampTo(v, 0.5, '+0');
    }
  });
  channel.type$.subscribe((v) => {
    if (v) {
      nodes.synth.oscillator.type = v;
    }
  });
  channel.modType$.subscribe((v) => {
    if (v) {
      nodes.fmOsc.forEach((n) => (n.type = v));
    }
  });
  channel.modTypeAm$.subscribe((v) => {
    if (v) {
      nodes.amOsc.forEach((n) => (n.type = v));
    }
  });
  channel.modAmount$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.fmOsc.slice(0, 1).forEach((n) => n.volume.rampTo(v, 0.5, '+0'));
    }
  });
  channel.modAmountAm$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.amOsc.slice(0, 1).forEach((n) => n.volume.rampTo(v, 0.5, '+0'));
    }
  });
  channel.volume$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.channel.volume.rampTo(v, 0.5, '+0');
    }
  });
  channel.useAM$.subscribe((v) => {
    const eeg = get(eegStateReady$);
    const mode = get(feedbackMode$);
    const amt = get(channel.modAmountAm$);
    if (v) {
      if (eeg) {
        if (
          channelMode === RIGHT_CHANNEL ||
          (channelMode === LEFT_CHANNEL && mode > 0)
        ) {
          nodes.startAmEEG();
        } else if (channelMode === LEFT_CHANNEL && mode === 0) {
          nodes.startAm();
          nodes.amOsc[0].volume.rampTo(amt, 0.5, '+0');
        }
      } else {
        nodes.startAm();
        nodes.amOsc[0].volume.rampTo(amt, 0.5, '+0');
      }
    } else {
      nodes.stopAm();
      nodes.stopAmEEG();
    }
  });
  channel.useFM$.subscribe((v) => {
    const eeg = get(eegStateReady$);
    const mode = get(feedbackMode$);
    const amt = get(channel.modAmount$);
    if (v) {
      if (eeg) {
        if (
          channelMode === RIGHT_CHANNEL ||
          (channelMode === LEFT_CHANNEL && mode > 0)
        ) {
          nodes.startFmEEG();
        } else if (channelMode === LEFT_CHANNEL && mode === 0) {
          nodes.startFm();
          nodes.fmOsc[0].volume.rampTo(amt, 0.5, '+0');
        }
      } else {
        nodes.startFm();
        nodes.fmOsc[0].volume.rampTo(amt, 0.5, '+0');
      }
    } else {
      nodes.stopFm();
      nodes.stopFmEEG();
    }
  });
  feedbackMode$.subscribe((v) => {
    const am = get(channel.useAM$);
    const fm = get(channel.useFM$);
    if (v === 0 && channelMode === LEFT_CHANNEL) {
      nodes.amOsc[0].set({ frequency: get(channel.modFreqAm$) });
      nodes.amOsc[0].volume.rampTo(get(channel.modAmountAm$), 0.5, '+0');
      nodes.fmOsc[0].set({ frequency: get(channel.modFreq$) });
      nodes.fmOsc[0].volume.rampTo(get(channel.modAmount$), 0.5, '+0');
      if (am) {
        nodes.stopAmEEG();
      }
      if (fm) {
        nodes.stopFmEEG();
      }
    }
    if (v > 0 && channelMode === LEFT_CHANNEL) {
      if (am) {
        nodes.startAm();
        nodes.startAmEEG();
      }
      if (fm) {
        nodes.startFm();
        nodes.startFmEEG();
      }
    }
  });
};

const setupNoise = (channel, nodes) => {
  channel.volume$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.noiseChan.volume.rampTo(v, 0.5, '+0');
    }
  });
  channel.speed$.subscribe((v) => {
    if (typeof v === 'number') {
      nodes.noise.set({ playbackRate: v });
      nodes.pinkNoise.set({ playbackRate: v });
      nodes.whiteNoise.set({ playbackRate: v });
    }
  });
  channel.on$.subscribe((v) => {
    const audioState = get(audioState$);
    const contextState = get(contextStarted$);
    if (
      !v &&
      nodes.noise.state === 'started' &&
      audioState === AUDIO_STATE.started &&
      contextState
    ) {
      nodes.noise.stop();
      nodes.pinkNoise.stop();
      nodes.whiteNoise.stop();
      nodes.lfo.stop();
      nodes.lfo1.stop();
      nodes.lfo2.stop();
    } else if (
      v &&
      nodes.noise.state === 'stopped' &&
      audioState === AUDIO_STATE.started &&
      contextState
    ) {
      nodes.noise.start();
      nodes.pinkNoise.start();
      nodes.whiteNoise.start();
      nodes.lfo.start();
      nodes.lfo1.start();
      nodes.lfo2.start();
    }
  });
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

const bootstrapOscillators = (count = 5, type = 'fm', settings, synth) => {
  const nodes = [];
  const osc = new Oscillator({
    type: type === 'fm' ? settings.modType : settings.modTypeAm,
    frequency: type === 'fm' ? settings.modFreq : settings.modFreqAm,
  });
  nodes.push(osc);

  osc.sync();
  if (type === 'fm') {
    osc.connect(synth.frequency);
    osc.volume.rampTo(settings.modAmount);
    if (settings.useFM) {
      osc.start();
    }
  }
  if (type === 'am') {
    osc.connect(synth.volume);
    osc.volume.rampTo(settings.modAmountAm);
    if (settings.useAM) {
      osc.start();
    }
  }

  for (let i = 0; i < count; i++) {
    const node = new Oscillator({
      type: type === 'fm' ? settings.modType : settings.modTypeAm,
      frequency: 1,
    });
    node.sync();
    if (type === 'fm') {
      node.volume.rampTo(settings.modAmount);
    }
    if (type === 'am') {
      node.volume.rampTo(settings.modAmountAm);
    }
    nodes.push(node);
  }
  return nodes;
};

const bootstrapSynth = (settings, nodes, outputChannel, analyzer) => {
  const synth = new Synth({
    oscillator: { type: settings.type },
  });

  const channel = new Channel(settings.volume, outputChannel).connect(analyzer);
  synth.connect(channel);
  synth.sync();

  const amOsc = bootstrapOscillators(5, 'am', settings, synth);
  const fmOsc = bootstrapOscillators(5, 'fm', settings, synth);

  nodes.set({
    synth,
    channel,
    amOsc,
    startAmEEG: () =>
      amOsc.slice(1).forEach((o) => {
        console.log(o);
        if (o.state === 'stopped') {
          o.connect(synth.volume);
          o.start();
          o.volume.rampTo(settings.modAmountAm);
        }
      }),
    stopAmEEG: () =>
      amOsc.slice(1).forEach((o) => {
        o.disconnect(synth.volume);
        o.stop();
      }),
    getAmEEG: () => amOsc.slice(1),
    startAm: () => {
      amOsc[0].connect(synth.volume);
      amOsc[0].start();
    },
    stopAm: () => {
      amOsc[0].stop();
      amOsc[0].disconnect(synth.volume);
    },
    fmOsc,
    startFmEEG: () =>
      fmOsc.slice(1).forEach((o) => {
        if (o.state === 'stopped') {
          o.connect(synth.frequency);
          o.start();
          o.volume.rampTo(settings.modAmount);
        }
      }),
    stopFmEEG: () =>
      fmOsc.slice(1).forEach((o) => {
        o.disconnect(synth.frequency);
        o.stop();
      }),
    getFmEEG: () => fmOsc.slice(1),
    startFm: () => {
      fmOsc[0].connect(synth.frequency);
      fmOsc[0].start();
    },
    stopFm: () => {
      fmOsc[0].stop();
      fmOsc[0].disconnect(synth.frequency);
    },
  });
};

const createContext = () => {
  return start();
};

const bootstrapAudio = () => {
  const analyzer = new Analyser({
    type: 'waveform',
    channels: 2,
    size: 4096,
  }).toDestination();
  const left = get(leftChannel.state);
  bootstrapSynth(left, leftNodes, LEFT_CHANNEL, analyzer);
  setupSynth(leftChannel.items, get(leftNodes), LEFT_CHANNEL);

  const right = get(rightChannel.state);
  bootstrapSynth(right, rightNodes, RIGHT_CHANNEL, analyzer);
  setupSynth(rightChannel.items, get(rightNodes), RIGHT_CHANNEL);

  setupPresets(defaultPreset, leftChannel.items, rightChannel.items);

  const n = get(noise.state);

  const noiseNode = new Noise({
    playbackRate: n.speed,
    type: 'brown',
    volume: -15,
  });
  const pinkNoise = new Noise({
    playbackRate: n.speed,
    type: 'pink',
    volume: -20,
  });
  const whiteNoise = new Noise({
    playbackRate: n.speed,
    type: 'white',
    volume: -22,
  });

  const filter = new Filter({
    type: 'lowpass',
    frequency: 700,
    Q: 1,
  });
  const filter1 = new Filter({
    type: 'lowpass',
    frequency: 700,
    Q: 1,
  });
  const filter2 = new Filter({
    type: 'lowpass',
    frequency: 400,
    Q: 1,
  });

  const lfo = new LFO({
    frequency: 0.2,
    min: 700,
    max: 1100,
  });
  const lfo1 = new LFO({
    frequency: 0.3,
    min: 700,
    max: 1300,
    phase: 90,
  });
  const lfo2 = new LFO({
    frequency: 0.1,
    min: 400,
    max: 1100,
    phase: 180,
  });

  const noiseChan = new Channel(n.volume).toDestination();

  lfo.connect(filter.frequency);
  lfo.sync();
  lfo.start();
  lfo1.connect(filter1.frequency);
  lfo1.sync();
  lfo1.start();
  lfo2.connect(filter2.frequency);
  lfo2.sync();
  lfo2.start();

  filter.connect(noiseChan);
  filter1.connect(noiseChan);
  filter2.connect(noiseChan);

  pinkNoise.fan(filter, filter1, filter2);
  whiteNoise.fan(filter, filter1, filter2);
  noiseNode.fan(filter, filter1, filter2);
  noiseNodes.set({
    noise: noiseNode,
    pinkNoise,
    whiteNoise,
    filter,
    filter1,
    filter2,
    lfo,
    lfo1,
    lfo2,
    noiseChan,
    analyzer,
  });
  setupNoise(noise.items, get(noiseNodes));
  Transport.start();
};

const startNodes = () => {
  const left = get(leftNodes);
  const right = get(rightNodes);
  const noiseN = get(noiseNodes);

  const leftSettings = get(leftChannel.state);
  const rightSettings = get(rightChannel.state);
  const noiseSettings = get(noise.state);
  if (noiseSettings.on) {
    noiseN.noise.start();
    noiseN.pinkNoise.start();
    noiseN.whiteNoise.start();
    noiseN.lfo.start();
    noiseN.lfo1.start();
    noiseN.lfo2.start();
  }

  left.synth.triggerAttack(leftSettings.freq, '+0', 1);
  right.synth.triggerAttack(rightSettings.freq, '+0', 1);
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

  n.noise.stop();
  n.pinkNoise.stop();
  n.whiteNoise.stop();
  n.lfo2.stop();
  n.lfo1.stop();
  n.lfo2.stop();

  left.stopAm();
  left.stopFm();
  left.stopAmEEG();
  left.stopFmEEG();

  right.stopAm();
  right.stopFm();
  right.stopAmEEG();
  right.stopFmEEG();
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
