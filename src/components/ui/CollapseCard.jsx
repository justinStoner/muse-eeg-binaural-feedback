import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const CollapseCard = ({
  title,
  children,
  cardProps = {},
  contentProps = {},
  show,
  setShow,
  spacing = 1,
  Action = null,
}) => {
  const [showPane, setShowPane] = useState(true);
  return (
    <Card {...cardProps}>
      <CardHeader
        subheader={title}
        action={
          <FormGroup row>
            {Action && <Action />}
            <FormControlLabel
              control={
                <Switch
                  checked={show !== undefined ? show : showPane}
                  onChange={(e) => {
                    if (show !== undefined) {
                      setShow(e.target.checked);
                    } else {
                      setShowPane(e.target.checked);
                    }
                  }}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              }
              label="Show"
            />
          </FormGroup>
        }
      />
      {(show !== undefined ? show : showPane) && (
        <CardContent {...contentProps}>
          <Grid container spacing={spacing}>
            {children}
          </Grid>
        </CardContent>
      )}
    </Card>
  );
};

export const CollapsePane = ({ children, label, onChange }) => {
  const [showPane, setShowPane] = useState(false);
  useEffect(() => {
    if (onChange) {
      onChange(showPane);
    }
  }, [showPane]);
  return (
    <Grid container item>
      <Grid item xs={8}>
        <Typography
          sx={{ color: 'rgba(255, 255, 255, 0.7)', paddingTop: '8px' }}
        >
          {label}
        </Typography>
      </Grid>
      <Grid item xs={4} sx={{ textAlign: 'right' }}>
        <IconButton onClick={() => setShowPane(!showPane)}>
          {showPane ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Grid>
      <Grid item xs={12}>
        <Collapse in={showPane} timeout="auto" unmountOnExit>
          <Grid container>
            <Grid item xs={12}>
              {showPane && <>{children}</>}
            </Grid>
          </Grid>
        </Collapse>
      </Grid>
    </Grid>
  );
};

export default CollapseCard;
