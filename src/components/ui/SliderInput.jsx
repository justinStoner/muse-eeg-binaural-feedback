import { Grid, Input, Slider, Typography } from '@mui/material';

const SliderInput = ({
  label,
  xs,
  md,
  value,
  inputWidth = 60,
  inputRange,
  range,
  onChange,
  onSliderChange,
  disabled,
  spacing = 1,
}) => {
  return (
    <Grid item xs={xs} md={md ? md : xs}>
      <Grid container spacing={spacing} alignItems="left">
        <Grid item>
          <Typography
            gutterBottom
            sx={{ color: (theme) => theme.palette.text.secondary }}
          >
            <span>{label} </span>
          </Typography>
        </Grid>
        <Grid item xs>
          <Input
            size="small"
            value={value}
            sx={{ width: inputWidth }}
            onBlur={(e) => onChange(e)}
            onChange={(e) => onChange(e)}
            disabled={disabled}
            inputProps={{
              step: inputRange ? inputRange.step : range.step,
              min: inputRange ? inputRange.min : range.min,
              max: inputRange ? inputRange.max : range.max,
              type: 'number',
            }}
          />
        </Grid>
      </Grid>
      <Slider
        min={range.min === 0 ? undefined : range.min}
        step={range.step}
        max={range.max}
        value={value}
        disabled={disabled}
        onChange={(e, v) =>
          onSliderChange ? onSliderChange(e, v) : onChange(e, v)
        }
      />
    </Grid>
  );
};

export default SliderInput;
