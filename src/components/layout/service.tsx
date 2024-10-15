import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import makeStyles from '@mui/styles/makeStyles';
import type { SubmissionProfileParams } from 'components/models/base/config';
import type { ServiceSpecification } from 'components/models/base/service';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(theme => ({
  no_pad: {
    padding: 0
  },
  item: {
    marginLeft: 0,
    width: '100%',
    '&:hover': {
      background: theme.palette.action.hover
    }
  }
}));

type ResetButtonProps = {
  value: any;
  defaultValue: any;
  hasResetButton?: boolean;
  reset?: () => void;
};

const ResetButton: React.FC<ResetButtonProps> = React.memo(
  ({ value, defaultValue, hasResetButton = false, reset }: ResetButtonProps) => {
    const { t } = useTranslation(['adminServices']);
    const theme = useTheme();

    return hasResetButton && value !== defaultValue ? (
      <Tooltip title={t('reset.tooltip')} placement="right">
        <Button
          style={{ marginLeft: theme.spacing(1), padding: 0, lineHeight: '1rem' }}
          onClick={event => {
            event.stopPropagation();
            event.preventDefault();
            reset();
          }}
          size="small"
          color="secondary"
          variant="outlined"
        >
          {t('reset')}
        </Button>
      </Tooltip>
    ) : null;
  }
);

type ParamProps = {
  disabled: boolean;
  hasResetButton: boolean;
  idx: any;
  param: any;
  pidx: any;
  service?: string;
  setParam: any;
  submissionProfile?: SubmissionProfileParams;
};

const Param: React.FC<ParamProps> = React.memo(({ disabled, param, pidx, idx, hasResetButton = false, setParam }) => {
  const classes = useStyles();
  const theme = useTheme();

  const [value, setValue] = useState<number>(param.value);
  const parsedValue = useMemo<string>(() => `${value}`, [value]);

  const handleIntChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let num = parseInt(event.target.value);
      num = isNaN(num) ? 0 : num;
      setValue(num);
      setParam(idx, pidx, num);
    },
    [idx, pidx, setParam]
  );

  return (
    <div key={pidx} style={{ paddingBottom: theme.spacing(1) }}>
      {param.type === 'bool' ? (
        <div>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={param.value}
                name="label"
                onChange={() => setParam(idx, pidx, !param.value)}
              />
            }
            label={
              <Typography variant="body2" style={{ textTransform: 'capitalize' }}>
                {param.name.replace(/_/g, ' ')}
                <ResetButton
                  value={param.value}
                  defaultValue={param.default}
                  hasResetButton={hasResetButton}
                  reset={() => setParam(idx, pidx, param.default)}
                />
              </Typography>
            }
            className={classes.item}
            disabled={disabled}
          />
        </div>
      ) : (
        <>
          <div>
            <Typography variant="caption" gutterBottom style={{ textTransform: 'capitalize' }} color="textSecondary">
              {param.name.replace(/_/g, ' ')}
              <ResetButton
                value={param.value}
                defaultValue={param.default}
                hasResetButton={hasResetButton}
                reset={() => {
                  setValue(param.default);
                  setParam(idx, pidx, param.default);
                }}
              />
            </Typography>
          </div>
          {param.type === 'list' ? (
            <FormControl size="small" fullWidth>
              <Select
                disabled={disabled}
                value={param.value}
                variant="outlined"
                onChange={event => setParam(idx, pidx, event.target.value)}
                fullWidth
              >
                {param.list ? (
                  param.list.map((item, i) => (
                    <MenuItem key={i} value={item}>
                      {item}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" />
                )}
              </Select>
            </FormControl>
          ) : param.type === 'str' ? (
            <TextField
              variant="outlined"
              disabled={disabled}
              type="text"
              size="small"
              value={param.value}
              onChange={event => setParam(idx, pidx, event.target.value)}
              fullWidth
            />
          ) : (
            <TextField
              variant="outlined"
              disabled={disabled}
              type="number"
              size="small"
              value={parsedValue}
              onChange={handleIntChange}
              fullWidth
            />
          )}
        </>
      )}
    </div>
  );
});

type ServiceProps = {
  idx: any;
  setParam: any;
  service: ServiceSpecification;
  submissionProfile: SubmissionProfileParams;
  disabled: boolean;
  hasResetButton?: boolean;
};

export const Service: React.FC<ServiceProps> = React.memo(
  ({ disabled, service, idx, hasResetButton = false, setParam, submissionProfile = null }) => {
    const theme = useTheme();
    const [showMore, setShowMore] = useState(false);
    const { t } = useTranslation();
    const profileSpec = submissionProfile ? submissionProfile.service_spec[service as unknown as string] : null;
    return (
      <div
        key={idx}
        style={{ paddingTop: theme.spacing(1), paddingBottom: theme.spacing(1), pageBreakInside: 'avoid' }}
      >
        {submissionProfile ? (
          // We're going to only show parameters that are allowed to be edited (whether if they're meant to be hidden or not)
          <>
            {service.params
              .filter(param => (submissionProfile.editable_params[service.name] || []).includes(param.name))
              .map((param, pidx) => (
                <Param
                  key={pidx}
                  disabled={disabled || (profileSpec && profileSpec[param.name] !== undefined)}
                  param={param}
                  pidx={pidx}
                  idx={idx}
                  hasResetButton={hasResetButton}
                  setParam={setParam}
                />
              ))}
          </>
        ) : (
          <>
            {service.params.map(
              (param, pidx) =>
                !param.hide && (
                  <Param
                    key={pidx}
                    disabled={disabled}
                    param={param}
                    pidx={pidx}
                    idx={idx}
                    hasResetButton={hasResetButton}
                    setParam={setParam}
                  />
                )
            )}
            {showMore
              ? service.params.map(
                  (param, pidx) =>
                    param.hide && (
                      <Param
                        key={pidx}
                        disabled={disabled}
                        param={param}
                        pidx={pidx}
                        idx={idx}
                        hasResetButton={hasResetButton}
                        setParam={setParam}
                      />
                    )
                )
              : service.params.filter(param => param.hide).length !== 0 && (
                  <Tooltip title={t('show_more')}>
                    <Button size="small" onClick={() => setShowMore(true)} style={{ padding: 0 }}>
                      <MoreHorizIcon />
                    </Button>
                  </Tooltip>
                )}
          </>
        )}
      </div>
    );
  }
);

export default Service;
