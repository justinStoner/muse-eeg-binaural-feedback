import { get } from '@hungry-egg/rx-state';

import {
  brainwaveCoeffecients,
  eegDebug$,
  feedbackMode$,
  LEFT_CHANNEL,
  leftChannel,
  leftNodes as leftNodes$,
  RIGHT_CHANNEL,
  rightChannel,
  rightNodes,
  spectraSettings,
} from '../store';
import { getScaledValue } from '../utils';

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
        freq.exponentialApproachValueAtTime(freqV, 0, rampTime);
      }
      if (
        gain.value < 0
          ? Math.floor(gain.value) !== Math.floor(gainV)
          : Math.ceil(gain.value) !== Math.ceil(gainV)
      ) {
        gain.setRampPoint('+0');
        gain.exponentialApproachValueAtTime(gainV, 0, rampTime);
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
