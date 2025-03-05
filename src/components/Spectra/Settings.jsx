import { Grid, MenuItem, Select, Typography } from '@mui/material';

import { buildPipe, setup } from '../../EEG';
import {
  brainwaveCoeffecients,
  feedbackMode$,
  subscribeAudio,
  unsubscribeAudio,
} from '../../store';
import { useUnwrap } from '../../store/audio';
import CollapseCard from '../ui/CollapseCard';
import SliderInput from '../ui/SliderInput';

export function SpectraSliders({ setData, status, Settings }) {
  function resetPipeSetup() {
    unsubscribeAudio();
    buildPipe(Settings);
    setup(setData, Settings);
    subscribeAudio();
  }

  function handleIntervalRangeSliderChange(e) {
    if (e.target.value && !Number.isNaN(Number(e.target.value))) {
      spectraSettings.items.interval.set(Number(e.target.value) * 1000);
      resetPipeSetup();
    }
  }

  const deltaC = useUnwrap(brainwaveCoeffecients.items$.delta);
  const thetaC = useUnwrap(brainwaveCoeffecients.items$.theta);
  const alphaC = useUnwrap(brainwaveCoeffecients.items$.alpha);
  const betaC = useUnwrap(brainwaveCoeffecients.items$.beta);
  const gammaC = useUnwrap(brainwaveCoeffecients.items$.gamma);
  const feedbackMode = useUnwrap(feedbackMode$);

  // function handleCutoffLowRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, cutOffLow: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleCutoffHighRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, cutOffHigh: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleSliceFFTLowRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, sliceFFTLow: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleSliceFFTHighRangeSliderChange(e, value) {

  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, sliceFFTHigh: value}));
  //       resetPipeSetup();
  //   }
  // }

  // function handleDurationRangeSliderChange(e, value) {
  //   if (typeof value === 'number') {
  //       setSettings(prevState => ({...prevState, duration: value}));
  //       resetPipeSetup();
  //   }
  // }

  // <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Epoch duration (Sampling Points): ' + Settings.duration}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={128} step={128} max={4096}
  //         label={'Epoch duration (Sampling Points): ' + Settings.duration}
  //         value={Settings.duration}
  //         onChange={handleDurationRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Cutoff Frequency Low: ' + Settings.cutOffLow + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={.01} step={.5} max={Settings.cutOffHigh - .5}
  //         label={'Cutoff Frequency Low: ' + Settings.cutOffLow + ' Hz'}
  //         value={Settings.cutOffLow}
  //         onChange={handleCutoffLowRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Cutoff Frequency High: ' + Settings.cutOffHigh + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={Settings.cutOffLow + .5} step={.5} max={Settings.srate/2}
  //         label={'Cutoff Frequency High: ' + Settings.cutOffHigh + ' Hz'}
  //         value={Settings.cutOffHigh}
  //         onChange={handleCutoffHighRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Slice FFT Lower limit: ' + Settings.sliceFFTLow + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={1} max={Settings.sliceFFTHigh - 1}
  //         label={'Slice FFT Lower limit: ' + Settings.sliceFFTLow + ' Hz'}
  //         value={Settings.sliceFFTLow}
  //         onChange={handleSliceFFTLowRangeSliderChange}
  //     />
  //     </Grid>
  //     <Grid item xs={6}>
  //     <Typography gutterBottom sx={{color: (theme) => theme.palette.text.secondary}}>
  //         {'Slice FFT Upper limit: ' + Settings.sliceFFTHigh + ' Hz'}
  //     </Typography>
  //     <Slider
  //         disabled={!status}
  //         min={Settings.sliceFFTLow + 1}
  //         label={'Slice FFT Upper limit: ' + Settings.sliceFFTHigh + ' Hz'}
  //         value={Settings.sliceFFTHigh}
  //         onChange={handleSliceFFTHighRangeSliderChange}
  //     />
  //     </Grid>

  return (
    <CollapseCard
      cardProps={{ sx: { marginBottom: (theme) => theme.spacing(2) } }}
      title="EEG feedback settings"
      spacing={2}
    >
      <SliderInput
        label="Feedback rate (seconds):"
        xs={12}
        value={Settings.interval / 1000}
        disabled={!status}
        inputWidth={70}
        spacing={2}
        range={{ step: 1, min: 1, max: 10 }}
        onChange={handleIntervalRangeSliderChange}
      />
      <Grid item xs={12}>
        <Typography
          gutterBottom
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          Mode
        </Typography>
        <Select
          value={`${feedbackMode}`}
          sx={{ maxWidth: 300 }}
          onChange={(e) => feedbackMode$.set(Number(e.target.value))}
        >
          <MenuItem value="0">
            left: constant tone <br></br> right: frequency modulation
          </MenuItem>
          <MenuItem value="1">
            left: frequency modulation from right brain <br></br> right:
            frequency modulation from left brain
          </MenuItem>
          <MenuItem value="2">
            left: frequency modulation from left brain <br></br> right:
            frequency modulation from right brain
          </MenuItem>
        </Select>
      </Grid>
      <SliderInput
        label="Delta intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(deltaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.delta.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
      <SliderInput
        label="Theta intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(thetaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.theta.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
      <SliderInput
        label="Alpha intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(alphaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.alpha.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
      <SliderInput
        label="Beta intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(betaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.beta.set(Number(e.target.value) / 100);
          }
        }}
      />
      <SliderInput
        label="Gamma intensity:"
        xs={6}
        spacing={2}
        value={Math.floor(gammaC * 100)}
        inputWidth={70}
        range={{ step: 1, min: 0, max: 100 }}
        onChange={(e) => {
          if (
            (e.target.value || e.target.value === 0) &&
            !Number.isNaN(Number(e.target.value))
          ) {
            brainwaveCoeffecients.items$.gamma.set(
              Number(e.target.value) / 100
            );
          }
        }}
      />
    </CollapseCard>
  );
}
