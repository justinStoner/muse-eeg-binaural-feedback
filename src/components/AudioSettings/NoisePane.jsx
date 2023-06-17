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

const NoisePane = () => {
  const { volume$, speed$, on$ } = noise.items;
  const volume = useUnwrap(volume$);
  const speed = useUnwrap(speed$);
  const isOn = useUnwrap(on$);
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
    </Grid>
  );
};

export default NoisePane;
