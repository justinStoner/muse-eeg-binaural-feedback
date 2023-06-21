import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';

import { useUnwrap } from '../../store/audio';
import SliderInput from '../ui/SliderInput';

function handleSliderChange(value, callback) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    callback(value);
  }
}

function handleSelectChange(value, callback) {
  if (value) {
    callback(value);
  }
}

const SynthPane = ({ channel, name }) => {
  const {
    volume$,
    modAmount$,
    modAmountAm$,
    type$,
    modType$,
    modTypeAm$,
    freq$,
    modFreq$,
    modFreqAm$,
    useAM$,
    useFM$,
    modRange$,
    modRangeAm$,
  } = channel.items;
  const volume = useUnwrap(volume$);
  const modAmount = useUnwrap(modAmount$);
  const modAmountAm = useUnwrap(modAmountAm$);
  const type = useUnwrap(type$);
  const modType = useUnwrap(modType$);
  const modTypeAm = useUnwrap(modTypeAm$);
  const modFreq = useUnwrap(modFreq$);
  const modFreqAm = useUnwrap(modFreqAm$);
  const modRange = useUnwrap(modRange$);
  const modRangeAm = useUnwrap(modRangeAm$);
  const freq = useUnwrap(freq$);
  const useAM = useUnwrap(useAM$);
  const useFM = useUnwrap(useFM$);
  return (
    <Grid container spacing={1} item xs={12}>
      <Grid item xs={12}>
        <Typography
          gutterBottom
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          {name} channel
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography
                gutterBottom
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                Base tone
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <div style={{ height: '29px' }}></div>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                gutterBottom
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                {'Wave: ' + type}
              </Typography>
              <Select
                value={type}
                onChange={(e) =>
                  handleSelectChange(e.target.value, (v) => type$.set(v))
                }
              >
                <MenuItem value="sine">Sine</MenuItem>
                <MenuItem value="sawtooth">Saw</MenuItem>
                <MenuItem value="square">Square</MenuItem>
                <MenuItem value="triangle">Triangle</MenuItem>
              </Select>
            </Grid>
            <SliderInput
              label="Freq:"
              xs={12}
              md={6}
              value={freq}
              inputWidth={70}
              inputRange={{ step: 0.01, min: 100, max: 2000 }}
              range={{ step: 1, min: 100, max: 1000 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) => freq$.set(v))
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => freq$.set(val))
              }
            />
            <SliderInput
              label="Vol.:"
              xs={12}
              value={volume}
              inputRange={{ step: 1, min: -50, max: 10 }}
              range={{ step: 1, min: -10, max: 8 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  volume$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => volume$.set(val))
              }
            />
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <Typography
                gutterBottom
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                Freq. Modulation
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <FormGroup row sx={{ flexDirection: 'row-reverse' }}>
                <FormControlLabel
                  label="On"
                  control={
                    <Checkbox
                      sx={{ padding: 0, marginRight: '9px' }}
                      checked={useFM}
                      onChange={() => useFM$.set(!useFM)}
                      size="small"
                    />
                  }
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                gutterBottom
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                {'Wave: ' + modType}
              </Typography>
              <Select
                value={modType}
                onChange={(e) =>
                  handleSelectChange(e.target.value, (v) => modType$.set(v))
                }
              >
                <MenuItem value="sine">Sine</MenuItem>
                <MenuItem value="sawtooth">Saw</MenuItem>
                <MenuItem value="square">Square</MenuItem>
                <MenuItem value="triangle">Triangle</MenuItem>
              </Select>
            </Grid>

            <SliderInput
              label="Freq:"
              xs={12}
              md={6}
              value={modFreq}
              inputWidth={70}
              inputRange={{ step: 0.01, min: 1, max: 100 }}
              range={{ step: 0.1, min: 1, max: 20 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  modFreq$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => modFreq$.set(val))
              }
            />
            <SliderInput
              label="Vol.:"
              xs={12}
              value={modAmount}
              inputRange={{ step: 1, min: -40, max: 30 }}
              range={{ step: 1, min: -40, max: 30 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  modAmount$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => modAmount$.set(val))
              }
            />
            <SliderInput
              label="Mod range.:"
              xs={12}
              value={modRange}
              inputRange={{ step: 1, min: 0, max: freq }}
              range={{ step: 1, min: 0, max: freq }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  modRange$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => modRange$.set(val))
              }
            />
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <Typography
                gutterBottom
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                Amp. Modulation
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <FormGroup row sx={{ flexDirection: 'row-reverse' }}>
                <FormControlLabel
                  label="On"
                  control={
                    <Checkbox
                      sx={{ padding: 0, marginRight: '9px' }}
                      checked={useAM}
                      onChange={() => useAM$.set(!useAM)}
                      size="small"
                    />
                  }
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                gutterBottom
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                {'Wave: ' + modTypeAm}
              </Typography>
              <Select
                value={modTypeAm}
                onChange={(e) =>
                  handleSelectChange(e.target.value, (v) => modTypeAm$.set(v))
                }
              >
                <MenuItem value="sine">Sine</MenuItem>
                <MenuItem value="sawtooth">Saw</MenuItem>
                <MenuItem value="square">Square</MenuItem>
                <MenuItem value="triangle">Triangle</MenuItem>
              </Select>
            </Grid>

            <SliderInput
              label="Freq:"
              xs={12}
              md={6}
              value={modFreqAm}
              inputWidth={70}
              inputRange={{ step: 0.01, min: 1, max: 100 }}
              range={{ step: 0.1, min: 1, max: 20 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  modFreqAm$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => modFreqAm$.set(val))
              }
            />
            <SliderInput
              label="Vol.:"
              xs={12}
              value={modAmountAm}
              inputRange={{ step: 1, min: -40, max: 30 }}
              range={{ step: 1, min: -40, max: 30 }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  modAmountAm$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => modAmountAm$.set(val))
              }
            />
            <SliderInput
              label="Mod range.:"
              xs={12}
              value={modRangeAm}
              inputRange={{ step: 1, min: 0, max: freq }}
              range={{ step: 1, min: 0, max: freq }}
              onChange={(e) =>
                handleSliderChange(Number(e.target.value), (v) =>
                  modRangeAm$.set(v)
                )
              }
              onSliderChange={(e, v) =>
                handleSliderChange(Number(v), (val) => modRangeAm$.set(val))
              }
            />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SynthPane;
