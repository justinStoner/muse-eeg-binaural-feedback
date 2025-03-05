import {
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Typography,
} from '@mui/material';

import { noise } from '../../store';
import { useUnwrap } from '../../store/audio';
import SliderInput from '../ui/SliderInput';

function handleSliderChange(value, callback) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    callback(value);
  }
}

const LfoSection = ({
  lfoFreq,
  lfoFreq$,
  lfoMin,
  lfoMin$,
  lfoMax,
  lfoMax$,
  lfoPhase,
  lfoPhase$,
  filterQ,
  filterQ$,
  filterGain,
  filterGain$,
}) => {
  return (
    <Grid item xs={4}>
      <Paper variant="outlined" sx={{ padding: 2 }}>
        <Grid container spacing={2}>
          <SliderInput
            label="LFO Freq:"
            xs={6}
            value={lfoFreq}
            inputWidth={70}
            range={{ step: 0.01, min: 0.01, max: 3 }}
            onChange={(e) =>
              handleSliderChange(Number(e.target.value), (v) => lfoFreq$.set(v))
            }
            onSliderChange={(e, v) =>
              handleSliderChange(Number(v), (val) => lfoFreq$.set(val))
            }
          />
          <SliderInput
            label="LFO min:"
            xs={6}
            value={lfoMin}
            inputWidth={70}
            range={{ step: 10, min: 50, max: 2000 }}
            onChange={(e) =>
              handleSliderChange(Number(e.target.value), (v) => lfoMin$.set(v))
            }
            onSliderChange={(e, v) =>
              handleSliderChange(Number(v), (val) => lfoMin$.set(val))
            }
          />
          <SliderInput
            label="LFO max:"
            xs={6}
            value={lfoMax}
            inputWidth={70}
            range={{ step: 10, min: 50, max: 2000 }}
            onChange={(e) =>
              handleSliderChange(Number(e.target.value), (v) => lfoMax$.set(v))
            }
            onSliderChange={(e, v) =>
              handleSliderChange(Number(v), (val) => lfoMax$.set(val))
            }
          />
          <SliderInput
            label="Phase:"
            xs={6}
            value={lfoPhase}
            inputWidth={70}
            range={{ step: 1, min: 0, max: 360 }}
            onChange={(e) =>
              handleSliderChange(Number(e.target.value), (v) =>
                lfoPhase$.set(v)
              )
            }
            onSliderChange={(e, v) =>
              handleSliderChange(Number(v), (val) => lfoPhase$.set(val))
            }
          />
          <SliderInput
            label="Filter Q:"
            xs={6}
            value={filterQ}
            inputWidth={70}
            range={{ step: 1, min: 0, max: 30 }}
            onChange={(e) =>
              handleSliderChange(Number(e.target.value), (v) => filterQ$.set(v))
            }
            onSliderChange={(e, v) =>
              handleSliderChange(Number(v), (val) => filterQ$.set(val))
            }
          />
          <SliderInput
            label="Filter Gain:"
            xs={6}
            value={Math.floor(filterGain * 100)}
            inputWidth={70}
            range={{ step: 1, min: 0, max: 100 }}
            onChange={(e) =>
              handleSliderChange(Number(e.target.value), (v) =>
                filterGain$.set(v / 100)
              )
            }
            onSliderChange={(e, v) =>
              handleSliderChange(Number(v), (val) => filterGain$.set(val / 100))
            }
          />
        </Grid>
      </Paper>
    </Grid>
  );
};

const NoisePane = () => {
  const {
    volume$,
    speed$,
    on$,
    lfo1Freq$,
    lfo1Max$,
    lfo1Min$,
    lfo1Phase$,

    filter1Q$,
    filter1Gain$,

    chorusFreq$,
    chorusDelay$,
    chorusDepth$,
    chorusFeedback$,
    chorusSpread$,
    reverbDecay$,
    reverbWet$,
  } = noise.items;
  const volume = useUnwrap(volume$);
  const speed = useUnwrap(speed$);
  const isOn = useUnwrap(on$);

  const lfo1Freq = useUnwrap(lfo1Freq$);
  const lfo1Max = useUnwrap(lfo1Max$);
  const lfo1Min = useUnwrap(lfo1Min$);
  const lfo1Phase = useUnwrap(lfo1Phase$);
  const filter1Q = useUnwrap(filter1Q$);
  const filter1Gain = useUnwrap(filter1Gain$);

  const chorusFreq = useUnwrap(chorusFreq$);
  const chorusDelay = useUnwrap(chorusDelay$);
  const chorusDepth = useUnwrap(chorusDepth$);
  const chorusSpread = useUnwrap(chorusSpread$);
  const chorusFeedback = useUnwrap(chorusFeedback$);
  const reverbDecay = useUnwrap(reverbDecay$);
  const reverbWet = useUnwrap(reverbWet$);

  return (
    <Grid container spacing={1} item xs={12}>
      <Grid item>
        <Typography
          gutterBottom
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          Noise
        </Typography>
      </Grid>
      <Grid
        item
        xs
        alignSelf="flex-end"
        style={{ display: 'flex', justifyContent: 'flex-end' }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={isOn}
              onChange={(e) => on$.set(e.target.checked)}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
          sx={{ color: (theme) => theme.palette.text.secondary }}
          label="On"
        />
      </Grid>
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Grid container spacing={2}>
            <SliderInput
              label="Volume:"
              xs={6}
              value={volume}
              inputWidth={70}
              inputRange={{ step: 1, min: -50, max: 10 }}
              range={{ step: 1, min: -50, max: 10 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  volume$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => volume$.set(val))
              }
            />
            <SliderInput
              label="Speed:"
              xs={6}
              value={speed}
              inputWidth={70}
              range={{ step: 0.01, min: 0.01, max: 1 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) => speed$.set(v))
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => speed$.set(val))
              }
            />
          </Grid>
        </Paper>
      </Grid>
      <LfoSection
        lfoFreq={lfo1Freq}
        lfoFreq$={lfo1Freq$}
        lfoMin={lfo1Min}
        lfoMin$={lfo1Min$}
        lfoMax={lfo1Max}
        lfoMax$={lfo1Max$}
        lfoPhase={lfo1Phase}
        lfoPhase$={lfo1Phase$}
        filterGain={filter1Gain}
        filterGain$={filter1Gain$}
        filterQ={filter1Q}
        filterQ$={filter1Q$}
      />
      <Grid item xs={8}>
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Grid container spacing={2}>
            <SliderInput
              label="Chorus delay"
              xs={3}
              value={chorusDelay}
              inputWidth={70}
              range={{ step: 100, min: 1, max: 6000 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  chorusDelay$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => chorusDelay$.set(val))
              }
            />
            <SliderInput
              label="Chorus feedback"
              xs={3}
              value={chorusFeedback}
              inputWidth={70}
              range={{ step: 0.1, min: 0, max: 1 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  chorusFeedback$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => chorusFeedback$.set(val))
              }
            />
            <SliderInput
              label="Chorus depth"
              xs={3}
              value={chorusDepth}
              inputWidth={70}
              range={{ step: 0.1, min: 0, max: 1 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  chorusDepth$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => chorusDepth$.set(val))
              }
            />
            <SliderInput
              label="Chorus Freq:"
              xs={3}
              value={chorusFreq}
              inputWidth={70}
              range={{ step: 1, min: 0, max: 20 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  chorusFreq$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => chorusFreq$.set(val))
              }
            />
            <SliderInput
              label="Chrous Spread"
              xs={3}
              value={chorusSpread}
              inputWidth={70}
              range={{ step: 1, min: 0, max: 180 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  chorusSpread$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => chorusSpread$.set(val))
              }
            />
            <SliderInput
              label="Reverb decay"
              xs={3}
              value={reverbDecay}
              inputWidth={70}
              range={{ step: 1, min: 0, max: 6 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  reverbDecay$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => reverbDecay$.set(val))
              }
            />
            <SliderInput
              label="Reverb wet"
              xs={3}
              value={reverbWet}
              inputWidth={80}
              range={{ step: 0.1, min: 0, max: 1 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  reverbWet$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => reverbWet$.set(val))
              }
            />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default NoisePane;
