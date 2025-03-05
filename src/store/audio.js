import { atom, combine, get } from '@hungry-egg/rx-state';
import { useEffect, useState } from 'react';

export function useUnwrap(observable$) {
  const [value, setValue] = useState(() => get(observable$));

  useEffect(() => {
    const subscription = observable$.subscribe(setValue);
    return function cleanup() {
      subscription.unsubscribe();
    };
  }, [observable$]);

  return value;
}

export const AudioNodes = (nodes) => atom(nodes);

export const SynthChannel = ({
  freq,
  modFreq,
  modFreqAm,
  type,
  modType,
  modTypeAm,
  modAmount,
  modAmountAm,
  volume,
  useAM = false,
  useFM = true,
}) => {
  const freq$ = atom(freq);
  const type$ = atom(type);
  const modFreq$ = atom(modFreq);
  const modFreqAm$ = atom(modFreqAm);
  const modType$ = atom(modType);
  const modTypeAm$ = atom(modTypeAm);
  const modAmount$ = atom(modAmount);
  const modAmountAm$ = atom(modAmountAm);
  const volume$ = atom(volume);
  const useAM$ = atom(useAM);
  const useFM$ = atom(useFM);
  return {
    state: combine({
      freq: freq$,
      modFreq: modFreq$,
      modFreqAm: modFreqAm$,
      type: type$,
      modType: modType$,
      modTypeAm: modTypeAm$,
      modAmount: modAmount$,
      modAmountAm: modAmountAm$,
      volume: volume$,
      useAM: useAM$,
      useFM: useFM$,
    }),
    items: {
      freq$,
      modFreq$,
      modFreqAm$,
      type$,
      modType$,
      modTypeAm$,
      modAmount$,
      modAmountAm$,
      volume$,
      useAM$,
      useFM$,
    },
  };
};

export const NoiseChannel = ({
  on,
  speed,
  volume,
  lfo1Freq,
  lfo1Min,
  lfo1Max,
  lfo1Phase,
  lfo2Freq,
  lfo2Min,
  lfo2Max,
  lfo2Phase,
  lfo3Freq,
  lfo3Min,
  lfo3Max,
  lfo3Phase,

  filter1Q,
  filter1Gain,

  filter2Q,
  filter2Gain,

  filter3Q,
  filter3Gain,

  chorusFreq,
  chorusDelay,
  chorusDepth,
  chorusSpread,
  chorusFeedback,

  reverbDecay,
  reverbWet,
}) => {
  const on$ = atom(on);
  const speed$ = atom(speed);
  const volume$ = atom(volume);

  const lfo1Freq$ = atom(lfo1Freq);
  const lfo1Min$ = atom(lfo1Min);
  const lfo1Max$ = atom(lfo1Max);
  const lfo1Phase$ = atom(lfo1Phase);

  const lfo2Freq$ = atom(lfo2Freq);
  const lfo2Min$ = atom(lfo2Min);
  const lfo2Max$ = atom(lfo2Max);
  const lfo2Phase$ = atom(lfo2Phase);

  const lfo3Freq$ = atom(lfo3Freq);
  const lfo3Min$ = atom(lfo3Min);
  const lfo3Max$ = atom(lfo3Max);
  const lfo3Phase$ = atom(lfo3Phase);

  const filter1Q$ = atom(filter1Q);
  const filter1Gain$ = atom(filter1Gain);

  const filter2Q$ = atom(filter2Q);
  const filter2Gain$ = atom(filter2Gain);

  const filter3Q$ = atom(filter3Q);
  const filter3Gain$ = atom(filter3Gain);

  const chorusFreq$ = atom(chorusFreq);
  const chorusDelay$ = atom(chorusDelay);
  const chorusDepth$ = atom(chorusDepth);
  const chorusSpread$ = atom(chorusSpread);
  const chorusFeedback$ = atom(chorusFeedback);

  const reverbDecay$ = atom(reverbDecay);
  const reverbWet$ = atom(reverbWet);

  return {
    state: combine({
      on: on$,
      speed: speed$,
      volume: volume$,

      lfo1Freq: lfo1Freq$,
      lfo1Min: lfo1Min$,
      lfo1Max: lfo1Max$,
      lfo1Phase: lfo1Phase$,

      lfo2Freq: lfo2Freq$,
      lfo2Min: lfo2Min$,
      lfo2Max: lfo2Max$,
      lfo2Phase: lfo2Phase$,

      lfo3Freq: lfo3Freq$,
      lfo3Min: lfo3Min$,
      lfo3Max: lfo3Max$,
      lfo3Phase: lfo3Phase$,

      filter1Q: filter1Q$,
      filter1Gain: filter1Gain$,

      filter2Q: filter2Q$,
      filter2Gain: filter2Gain$,

      filter3Q: filter3Q$,
      filter3Gain: filter3Gain$,

      chorusFreq: chorusFreq$,
      chorusDelay: chorusDelay$,
      chorusDepth: chorusDepth$,
      chorusFeedback: chorusFeedback$,
      chorusSpread: chorusSpread$,
      reverbDecay: reverbDecay$,
      reverbWet: reverbWet$,
    }),
    items: {
      on$,
      speed$,
      volume$,
      lfo1Freq$,
      lfo1Min$,
      lfo1Max$,
      lfo1Phase$,

      lfo2Freq$,
      lfo2Min$,
      lfo2Max$,
      lfo2Phase$,

      lfo3Freq$,
      lfo3Min$,
      lfo3Max$,
      lfo3Phase$,

      filter1Q$,
      filter1Gain$,

      filter2Q$,
      filter2Gain$,

      filter3Q$,
      filter3Gain$,

      chorusFreq$,
      chorusDelay$,
      chorusDepth$,
      chorusFeedback$,
      chorusSpread$,
      reverbDecay$,
      reverbWet$,
    },
  };
};

export const Presets = () => {
  const presets = [
    {
      name: 'Root',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 228,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 235.51,
        volume: 0,
      },
    },
    {
      name: 'Sacral',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 303,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 310.51,
        volume: 0,
      },
    },
    {
      name: 'Solar',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 182,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 189.51,
        volume: 0,
      },
    },
    {
      name: 'Heart',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 256,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 263.51,
        volume: 0,
      },
    },
    {
      name: 'Throat',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 192,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 199.51,
        volume: 0,
      },
    },
    {
      name: 'Eye',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 144,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 151.51,
        volume: 0,
      },
    },
    {
      name: 'Crown',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 432,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 7.51,
        modFreqAm: 7.51,
        modAmount: -2,
        modAmountAm: -8,
        freq: 439.51,
        volume: 0,
      },
    },
    {
      name: 'Monroe',
      left: {
        useAM: true,
        useFM: true,
        modFreq: 4,
        modFreqAm: 4,
        modAmount: -2,
        modAmountAm: -8,
        freq: 100,
        volume: 0,
      },
      right: {
        useAM: true,
        useFM: true,
        modFreq: 4,
        modFreqAm: 4,
        modAmount: -2,
        modAmountAm: -8,
        freq: 104,
        volume: 0,
      },
    },
  ];
  const selectedPreset$ = atom(-1);
  const presets$ = atom(presets);
  return {
    presets$,
    selectedPreset$,
    defaultPresets: presets,
  };
};

export const defaultPreset = Presets();
