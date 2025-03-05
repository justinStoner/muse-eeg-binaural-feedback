import { get } from '@hungry-egg/rx-state';
import {
  Chorus,
  Filter,
  Gain,
  LFO,
  LowpassCombFilter,
  Noise,
  Reverb,
} from 'tone';

import {
  AUDIO_STATE,
  audioState$,
  contextStarted$,
  noiseNodes,
} from '../store';

const getLfoSetters = (i) => ({
  [`lfo${i + 1}Freq`]: (nodes, value) =>
    nodes.lfos[i].set({ frequency: value }),
  [`lfo${i + 1}Min`]: (nodes, value) => nodes.lfos[i].set({ min: value }),
  [`lfo${i + 1}Max`]: (nodes, value) => nodes.lfos[i].set({ max: value }),
  [`lfo${i + 1}Phase`]: (nodes, value) => nodes.lfos[i].set({ phase: value }),
});

const getFilterSetters = (i) => ({
  [`filter${i + 1}Q`]: (nodes, value) => nodes.filters[i].set({ Q: value }),
  [`filter${i + 1}Gain`]: (nodes, value) =>
    nodes.lfos[i].set({ amplitude: value }),
});

const nodeSetters = {
  chorusDelay: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.chorus.set({ delayTime: value });
    }
  },
  chorusFeedback: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.chorus.set({ feedback: value });
    }
  },
  chorusDepth: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.chorus.set({ depth: value });
    }
  },
  chorusFreq: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.chorus.set({ frequency: value });
    }
  },
  chorusSpread: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.chorus.set({ spread: value });
    }
  },
  reverbWet: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.reverb.set({ wet: value });
    }
  },
  reverbDecay: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.reverb.set({ decay: value });
    }
  },
  speed: (nodes, value) => {
    if (typeof value === 'number') {
      nodes.noise.slice(0, 1).forEach((n) => n.set({ playbackRate: value }));
    }
  },
  volume: (nodes, value) =>
    typeof value === 'number' &&
    nodes.noise.slice(0, 1).forEach((n) => n.set({ volume: value })),
  ...getLfoSetters(0),
  // ...getLfoSetters(1),
  // ...getLfoSetters(2),
  ...getFilterSetters(0),
  // ...getFilterSetters(1),
  // ...getFilterSetters(2),
};
const NoiseSynth = ({ settings }) => {
  let last = {};
  const getGraph = (chan, lastChan) => {
    const nodes = get(noiseNodes);
    Object.entries(nodeSetters).forEach(([key, setter]) => {
      if (chan[key] !== lastChan[key]) {
        setter(nodes, chan[key]);
      }
      if (chan.on !== lastChan.on) {
        const audioState = get(audioState$);
        const contextState = get(contextStarted$);
        if (
          !chan.on &&
          nodes.noise[0].state === 'started' &&
          audioState === AUDIO_STATE.started &&
          contextState
        ) {
          nodes.noise.slice(0, 1).forEach((n, i) => {
            n.stop();
            nodes.lfos[i].stop();
          });
        } else if (
          chan.on &&
          nodes.noise[0].state === 'stopped' &&
          audioState === AUDIO_STATE.started &&
          contextState
        ) {
          nodes.noise.slice(0, 1).forEach((n, i) => {
            n.start();
            nodes.lfos[i].start();
          });
        }
      }
    });

    return chan;
  };

  settings.subscribe((chan) => {
    if (chan && get(noiseNodes)) {
      last = getGraph(chan, last);
    }
  });
  return {
    initNoise: () => initNoise(settings),
  };
};

const noiseSettings = [{ type: 'brown' }, { type: 'brown' }, { type: 'pink' }];

const filterSettings = [
  { type: 'lowpass', frequency: 500 },
  { type: 'lowpass', frequency: 700 },
  { type: 'lowpass', frequency: 300 },
];
const lfoSettings = [
  {
    frequency: 0.1,
    min: 500,
    max: 1400,
  },
  {
    frequency: 0.15,
    min: 700,
    max: 1300,
    phase: 90,
  },
  {
    frequency: 0.05,
    min: 300,
    max: 1100,
    phase: 180,
    type: 'sine',
  },
];

const initNoise = (s) => {
  const settings = get(s);
  console.log(settings);
  const noiseChan = new Gain(-1).toDestination();
  const lfos = lfoSettings.slice(0, 1).map((n, i) => {
    return new LFO({
      frequency: settings[`lfo${i + 1}Freq`],
      min: settings[`lfo${i + 1}Min`],
      max: settings[`lfo${i + 1}Max`],
      phase: settings[`lfo${i + 1}Phase`],
      amplitude: settings[`filter${i + 1}Gain`],
      type: 'sine',
    });
  });
  const noise = noiseSettings.map(
    (n) =>
      new Noise({ ...n, playbackRate: settings.speed, volume: settings.volume })
  );
  const chorus = new Chorus({
    frequency: settings.chorusFreq,
    delayTime: settings.chorusDelay,
    depth: settings.chorusDepth,
    spread: settings.chorusSpread,
    feedback: settings.chorusFeedback,
  });
  const reverb = new Reverb({
    decay: settings.reverbDecay,
    wet: settings.reverbWet,
  });
  reverb.generate();
  reverb.connect(chorus);
  chorus.start();

  const filters = filterSettings.slice(0, 1).map((n, i) => {
    const f = new Filter({
      ...n,
      Q: settings[`filter${i + 1}Q`],
      gain: settings[`filter${i + 1}Gain`],
    });
    lfos[i].connect(f.frequency);
    const fT = new LowpassCombFilter({
      dampening: 1750,
      delayTime: 0.1,
      resonance: 0,
    });
    f.connect(fT);
    chorus.connect(noiseChan);
    fT.connect(reverb);
    return f;
  });
  noise.slice(0, 1).forEach((n, i) => n.connect(filters[i]));

  noiseNodes.set({
    noise,
    lfos,
    filters,
    noiseChan,
    chorus,
    reverb,
    start: () => {
      noise.slice(0, 1).forEach((n, i) => {
        lfos[i].start();
        n.start();
      });
    },
    stop: () => {
      noise.slice(0, 1).forEach((n, i) => {
        lfos[i].stop();
        n.stop();
      });
    },
  });
};

export default NoiseSynth;
