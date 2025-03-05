import { get } from '@hungry-egg/rx-state';
import {
  Analyser,
  AudioToGain,
  Channel,
  Gain,
  getContext,
  Oscillator,
  Synth,
} from 'tone';

import {
  eegStateReady$,
  feedbackMode$,
  LEFT_CHANNEL,
  leftChannel as left,
  leftNodes,
  outputVisual$,
  RIGHT_CHANNEL,
  rightChannel as right,
  rightNodes,
} from '../store';

const BinauralSynth = () => {
  let lastLeft = {};
  let lastRight = {};
  let active = false;
  const getGraph = (chan, lastChan, nodes$, mode) => {
    const nodes = get(nodes$);
    const eeg = get(eegStateReady$);
    const fMode = get(feedbackMode$);
    Object.entries(nodeSetters).forEach(([key, setter]) => {
      if (chan[key] !== lastChan[key]) {
        setter(nodes, chan[key]);
      }
    });
    if (chan.useFM !== lastChan.useFM) {
      onModulationToggle({
        modOn: chan.useFM,
        modAmount: chan.modAmount,
        start: nodes.startFm,
        stop: nodes.stopFm,
        startEEG: nodes.startFmEEG,
        stopEEG: nodes.stopFmEEG,
        volume: nodes.fmOsc[0].volume,
        eeg,
        mode,
        fMode,
      });
    }
    if (chan.useAM !== lastChan.useAM) {
      onModulationToggle({
        modOn: chan.useAM,
        modAmount: chan.modAmountAm,
        start: nodes.startAm,
        stop: nodes.stopAm,
        startEEG: nodes.startAmEEG,
        stopEEG: nodes.stopAmEEG,
        volume: nodes.amOsc[0].volume,
        eeg,
        mode,
        fMode,
      });
    }

    return chan;
  };

  const start = () => {
    if (!active) {
      active = true;
      get(leftNodes).synth.triggerAttack(get(left.state).freq, '+0', 1);
      get(rightNodes).synth.triggerAttack(get(right.state).freq, '+0', 1);
    }
  };

  const stop = () => {
    if (active) {
      active = false;
      get(leftNodes).synth.triggerRelease('+0.5');
      get(rightNodes).synth.triggerRelease('+0.5');
    }
  };

  const init = () => {
    let lastOutputVisual = get(outputVisual$);
    const analyzer = new Analyser({
      type: 'waveform',
      channels: 2,
      size: 4096,
    });
    bootstrapSynth(get(left.state), leftNodes, LEFT_CHANNEL, analyzer);
    bootstrapSynth(get(right.state), rightNodes, RIGHT_CHANNEL, analyzer);
    left.state.subscribe((chan) => {
      lastLeft = getGraph(chan, lastLeft, leftNodes, 'left');
    });

    right.state.subscribe((chan) => {
      lastRight = getGraph(chan, lastRight, rightNodes, 'right');
    });
    feedbackMode$.subscribe((v) => {
      updateFeedbackMode(v, get(left.state), get(leftNodes), LEFT_CHANNEL);
      updateFeedbackMode(v, get(right.state), get(rightNodes), RIGHT_CHANNEL);
    });
    outputVisual$.subscribe((v) => {
      if (v !== lastOutputVisual) {
        try {
          const { analyzer, channel: lc } = get(leftNodes);
          const { channel: rc } = get(rightNodes);
          if (v) {
            lc.disconnect(getContext().destination);
            rc.disconnect(getContext().destination);
            analyzer.connect(getContext().destination);
            lc.connect(analyzer);
            rc.connect(analyzer);
          } else {
            lc.disconnect(analyzer);
            rc.disconnect(analyzer);
            analyzer.disconnect(getContext().destination);
            lc.toDestination();
            rc.toDestination();
          }
        } catch (e) {
          console.error(e);
        }
        lastOutputVisual = v;
      }
    });
  };
  return {
    init,
    start,
    stop,
  };
};

const onModulationToggle = ({
  modOn,
  modAmount,
  start,
  stop,
  startEEG,
  stopEEG,
  volume,
  eeg,
  mode,
  fMode,
}) => {
  if (modOn) {
    if (eeg) {
      if (mode === 'right' || (mode === 'left' && fMode > 0)) {
        startEEG();
      } else if (mode === 'left' && fMode === 0) {
        start();
        volume.rampTo(modAmount, 0.5, '+0');
      }
    } else {
      start();
      volume.rampTo(modAmount, 0.5, '+0');
    }
  } else {
    stop();
    stopEEG();
  }
};

const updateFeedbackMode = (v, chan, nodes, mode) => {
  if (v === 0 && mode === LEFT_CHANNEL) {
    nodes.amOsc[0].set({ frequency: chan.modFreqAm });
    nodes.amOsc[0].volume.rampTo(chan.modAmountAm, 0.5, '+0');
    nodes.fmOsc[0].set({ frequency: chan.modFreq });
    nodes.fmOsc[0].volume.rampTo(chan.modAmount, 0.5, '+0');
    if (chan.useAm) {
      nodes.stopAmEEG();
    }
    if (chan.useFm) {
      nodes.stopFmEEG();
    }
  }
  if (v > 0 && mode === LEFT_CHANNEL) {
    if (chan.useAm) {
      nodes.startAm();
      nodes.startAmEEG();
    }
    if (chan.useFm) {
      nodes.startFm();
      nodes.startFmEEG();
    }
  }
};

const nodeSetters = {
  freq: (nodes, value) =>
    typeof value === 'number' && nodes.synth.frequency.rampTo(value, 0, '+0'),
  modFreq: (nodes, value) =>
    typeof value === 'number' &&
    nodes.fmOsc[0].frequency.rampTo(value, 0, '+0'),
  modFreqAm: (nodes, value) =>
    typeof value === 'number' &&
    nodes.amOsc[0].frequency.rampTo(value, 0, '+0'),
  type: (nodes, value) => value && (nodes.synth.oscillator.type = value),
  modType: (nodes, value) =>
    value && nodes.fmOsc.forEach((n) => (n.type = value)),
  modTypeAm: (nodes, value) =>
    value && nodes.amOsc.forEach((n) => (n.type = value)),
  modAmount: (nodes, value) =>
    typeof value === 'number' &&
    nodes.fmOsc.slice(0, 1).forEach((n) => n.volume.rampTo(value, 0.5, '+0')),
  modAmountAm: (nodes, value) =>
    typeof value === 'number' &&
    nodes.amOsc.slice(0, 1).forEach((n) => n.volume.rampTo(value, 0.5, '+0')),
  volume: (nodes, value) =>
    typeof value === 'number' && nodes.channel.volume.rampTo(value, 0.5, '+0'),
};

const bootstrapOscillators = (count = 5, type = 'fm', settings, synth) => {
  const nodes = [];
  let amNodes = [];
  let aGain;
  const osc = new Oscillator({
    type: type === 'fm' ? settings.modType : settings.modTypeAm,
    frequency: type === 'fm' ? settings.modFreq : settings.modFreqAm,
  });
  nodes.push(osc);
  const audioToG = new AudioToGain();

  // osc.sync();
  if (type === 'fm') {
    osc.connect(synth.frequency);
    osc.volume.rampTo(settings.modAmount);
    if (settings.useFM) {
      osc.start();
    }
  }
  if (type === 'am') {
    aGain = new Gain({
      gain: 0,
      units: 'normalRange',
    });
    osc.connect(audioToG);

    osc.volume.rampTo(settings.modAmountAm);
    if (settings.useAM) {
      audioToG.connect(synth.volume);
      osc.start();
    }
  }

  for (let i = 0; i < count; i++) {
    let aNode;
    const node = new Oscillator({
      type: type === 'fm' ? settings.modType : settings.modTypeAm,
      frequency: 1,
    });
    // node.sync();
    if (type === 'fm') {
      node.volume.rampTo(settings.modAmount);
    }
    if (type === 'am') {
      aNode = new AudioToGain();

      node.volume.rampTo(settings.modAmountAm);
      node.connect(aNode);
      aNode.connect(aGain);
      amNodes.push(aNode);
    }
    nodes.push(node);
  }
  return [nodes, audioToG, amNodes, aGain];
};

const bootstrapSynth = (settings, nodes, outputChannel, analyzer) => {
  const synth = new Synth({
    oscillator: { type: settings.type },
  });

  const channel = new Channel(settings.volume, outputChannel).toDestination();
  synth.connect(channel);
  // synth.sync();

  const [amOsc, amA2g, , aGain] = bootstrapOscillators(
    5,
    'am',
    settings,
    synth
  );
  const [fmOsc] = bootstrapOscillators(5, 'fm', settings, synth);

  nodes.set({
    synth,
    channel,
    amOsc,
    amA2g,
    analyzer,
    startAmEEG: () => {
      if (amOsc[1].state === 'stopped') {
        aGain.connect(synth.volume);
        amOsc.slice(1).forEach((o) => {
          o.start();
          o.volume.rampTo(settings.modAmountAm);
        });
      }
    },
    stopAmEEG: () => {
      aGain.disconnect(synth.volume);
      amOsc.slice(1).forEach((o) => {
        o.stop();
      });
    },
    getAmEEG: () => amOsc.slice(1),
    startAm: () => {
      if (amOsc[0].state === 'stopped') {
        amA2g.connect(synth.volume);
        amOsc[0].start();
      }
    },
    stopAm: () => {
      amOsc[0].stop();
      amA2g.disconnect(synth.volume);
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
      if (fmOsc[0].state === 'stopped') {
        fmOsc[0].connect(synth.frequency);
        fmOsc[0].start();
      }
    },
    stopFm: () => {
      fmOsc[0].stop();
      fmOsc[0].disconnect(synth.frequency);
    },
  });
};

export default BinauralSynth();
