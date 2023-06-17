import {
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from '@mui/material';
import { useState } from 'react';
import { Transport } from 'tone';

import {
  contextStarted$,
  leftChannel,
  leftNodes,
  rightChannel,
  rightNodes,
} from '../../store';
import { defaultPreset, useUnwrap } from '../../store/audio';
import CollapseCard, { CollapsePane } from '../ui/CollapseCard';
import NoisePane from './NoisePane';
import SynthPane from './SynthPane';
import Visual, { OutputVisual } from './Visual';

const AudioSettings = () => {
  const selectedPreset = useUnwrap(defaultPreset.selectedPreset$);
  const presets = useUnwrap(defaultPreset.presets$);
  const [schedule, setSchedule] = useState(false);
  const contextStarted = useUnwrap(contextStarted$);
  const left = useUnwrap(leftNodes);
  const right = useUnwrap(rightNodes);
  const onPresetChange = (e) => {
    const presetIndex = Number(e.target.value);
    defaultPreset.selectedPreset$.set(presetIndex);
  };
  const releaseTime = 0;
  const attackTime = 0;

  return (
    <CollapseCard title="Audio settings">
      <Grid item xs={12}>
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={schedule}
                disabled={!contextStarted}
                onChange={(e) => {
                  setSchedule(e.target.checked);
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(0);
                    left.synth.triggerAttack(
                      presets[0].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[0].right.freq,
                      attackTime,
                      1
                    );
                  }, '+0');
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(1);
                    left.synth.triggerAttack(
                      presets[1].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[1].right.freq,
                      attackTime,
                      1
                    );
                  }, `+${60 * 10}`);
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(2);
                    left.synth.triggerAttack(
                      presets[2].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[2].right.freq,
                      attackTime,
                      1
                    );
                  }, `+${60 * 20}`);
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(3);
                    left.synth.triggerAttack(
                      presets[3].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[3].right.freq,
                      attackTime,
                      1
                    );
                  }, `+${60 * 30}`);
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(4);
                    left.synth.triggerAttack(
                      presets[4].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[4].right.freq,
                      attackTime,
                      1
                    );
                  }, `+${60 * 40}`);
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(5);
                    left.synth.triggerAttack(
                      presets[5].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[5].right.freq,
                      attackTime,
                      1
                    );
                  }, `+${60 * 50}`);
                  Transport.scheduleOnce(() => {
                    left.synth.triggerRelease(releaseTime);
                    right.synth.triggerRelease(releaseTime);
                    defaultPreset.selectedPreset$.set(6);
                    left.synth.triggerAttack(
                      presets[6].left.freq,
                      attackTime,
                      1
                    );
                    right.synth.triggerAttack(
                      presets[6].right.freq,
                      attackTime,
                      1
                    );
                  }, `+${60 * 60}`);
                }}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Schedule"
          />
          <FormControl
            size="small"
            sx={{
              marginRight: 2,
              marginTop: 1,
              marginLeft: { xs: 'auto', md: 0 },
            }}
          >
            <InputLabel id="preset-label">Preset</InputLabel>
            <Select
              label="Preset"
              id="preset"
              labelId="preset-label"
              value={selectedPreset}
              onChange={onPresetChange}
              disabled={!contextStarted}
            >
              <MenuItem value={-1} key={-1} disabled>
                Default
              </MenuItem>
              {presets.map((p, i) => (
                <MenuItem value={i} key={i}>
                  #{i + 1} left: {p.left.freq} right: {p.right.freq}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormGroup>
      </Grid>
      <NoisePane />
      <SynthPane name="Left" channel={leftChannel} />
      <SynthPane name="Right" channel={rightChannel} />
      <CollapsePane label="Channel waveforms">
        <Visual />
      </CollapsePane>
      <Divider />
      <CollapsePane label="Realtime waveform">
        {contextStarted && <OutputVisual name="Output" />}
      </CollapsePane>
    </CollapseCard>
  );
};

export default AudioSettings;
