import { Grid, Paper, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTransition } from 'react';
import { useRef } from 'react';
import { Channel, OfflineContext, Oscillator, ToneAudioBuffer } from 'tone';

import { leftChannel, leftNodes, rightChannel } from '../../store';
import { useUnwrap } from '../../store/audio';
import OfflineVisualization from '../Visual/OfflineVisualization';

const ChannelVisual = ({ name, buffer, channel }) => {
  const [, startTransition] = useTransition();
  const [buff, setBuffer] = useState([]);
  useEffect(() => {
    startTransition(() => {
      setBuffer(buffer);
    });
  }, [channel]);
  return (
    <Grid item xs={12} md={4}>
      <Paper variant="outlined" sx={{ padding: 2 }}>
        <Typography sx={{ marginBottom: (theme) => theme.spacing(1) }}>
          {name}
        </Typography>
        <OfflineVisualization color="#2196f3" buffer={buff} height={50} />
      </Paper>
    </Grid>
  );
};

export const OutputVisual = ({ name }) => {
  //const [, startTransition] = useTransition();
  const [buff, setBuffer] = useState([]);
  const analyzer = useUnwrap(leftNodes).analyzer;
  const animId = useRef(0);
  const previousDelta = useRef(0);
  const fpsLimit = useRef(10);
  const analyze = useMemo(() => {
    return (delta) => {
      animId.current = requestAnimationFrame(analyze);
      if (delta - previousDelta.current < 1000 / fpsLimit.current - 0.1) {
        return;
      }
      const sample = ToneAudioBuffer.fromArray(analyzer.getValue())
        .toMono()
        .toArray();

      setBuffer(() => Array.from(sample));

      previousDelta.current = delta;
    };
  });
  useEffect(() => {
    animId.current = requestAnimationFrame(analyze);
    return () => {
      cancelAnimationFrame(animId.current);
    };
  }, [name]);
  return (
    <Grid item xs={12}>
      <Paper variant="outlined" sx={{ padding: 2 }}>
        <Typography sx={{ marginBottom: (theme) => theme.spacing(1) }}>
          {name}
        </Typography>
        <OfflineVisualization color="#2196f3" buffer={buff} height={50} />
      </Paper>
    </Grid>
  );
};

const Visual = () => {
  const [, startTransition] = useTransition();
  const leftSettings = useUnwrap(leftChannel.state);
  const rightSettings = useUnwrap(rightChannel.state);
  const [leftBuffer, setLeftBuffer] = useState([]);
  const [rightBuffer, setrightBuffer] = useState([]);
  const [combinedBuffer, setCombinedBuffer] = useState([]);
  useEffect(() => {
    const ctx = new OfflineContext(2, 0.2, 3000);
    const LC = new Channel({
      volume: leftSettings.volume,
      pan: -1,
      context: ctx,
    }).connect(ctx.destination);
    const RC = new Channel({
      volume: rightSettings.volume,
      pan: 1,
      context: ctx,
    }).connect(ctx.destination);
    const synthL = new Oscillator({
      type: leftSettings.type,
      frequency: leftSettings.freq,
      context: ctx,
    }).connect(LC);
    if (leftSettings.useAM) {
      const osc = new Oscillator({
        type: leftSettings.modTypeAm,
        frequency: leftSettings.modFreqAm,
        volume: leftSettings.modAmountAm,
        context: ctx,
      });
      osc.connect(synthL.volume);
      osc.start();
    }
    if (leftSettings.useFM) {
      const osc = new Oscillator({
        type: leftSettings.modType,
        frequency: leftSettings.modFreq,
        volume: leftSettings.modAmount,
        context: ctx,
      });
      osc.connect(synthL.frequency);
      osc.start();
    }

    const synth = new Oscillator({
      type: rightSettings.type,
      frequency: rightSettings.freq,
      context: ctx,
    }).connect(RC);
    if (rightSettings.useAM) {
      const osc = new Oscillator({
        type: rightSettings.modTypeAm,
        frequency: rightSettings.modFreqAm,
        volume: rightSettings.modAmountAm,
        context: ctx,
      });
      osc.connect(synth.volume);
      osc.start();
    }
    if (rightSettings.useFM) {
      const osc = new Oscillator({
        type: rightSettings.modType,
        frequency: rightSettings.modFreq,
        volume: rightSettings.modAmount,
        context: ctx,
      });
      osc.connect(synth.frequency);
      osc.start();
    }
    synth.start();
    synthL.start();
    ctx.render().then((buf) => {
      startTransition(() => {
        const left = buf.getChannelData(0);
        const right = buf.getChannelData(1);
        setLeftBuffer(left.slice(0, left.length / 2));
        setrightBuffer(right.slice(0, right.length / 2));
        setCombinedBuffer(buf.toMono().toArray());
      });
    });
  }, [leftSettings, rightSettings]);
  return (
    <Grid container item spacing={2}>
      {combinedBuffer.length > 0 && (
        <>
          <ChannelVisual
            buffer={leftBuffer}
            channel={leftSettings}
            name="Left"
          />
          <ChannelVisual
            buffer={combinedBuffer}
            channel={{ rightSettings, leftSettings }}
            name="Combined"
          />
          <ChannelVisual
            buffer={rightBuffer}
            channel={rightSettings}
            name="Right"
          />
        </>
      )}
    </Grid>
  );
};
export default Visual;
