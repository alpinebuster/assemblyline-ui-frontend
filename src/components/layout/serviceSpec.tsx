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
import { ServiceParameter, ServiceSpecification } from 'components/models/base/service';
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

const WrappedResetButton = ({ value, defaultValue, hasResetButton = false, reset }: ResetButtonProps) => {
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
};

const ResetButton = React.memo(WrappedResetButton);

type ServiceProps = {
  service: ServiceSpecification;
  idx: number;
  disabled?: boolean;
  compressed?: boolean;
  hasResetButton?: boolean;
  setParam: (service_id: number, param_id: number, param_value: any) => void;
  isSelected?: (name: string) => boolean;
};

function WrappedService({ service, idx, disabled, hasResetButton = false, setParam }: ServiceProps) {
  const theme = useTheme();
  const [showMore, setShowMore] = useState(false);
  const { t } = useTranslation();
  return (
    <div key={idx} style={{ paddingTop: theme.spacing(1), paddingBottom: theme.spacing(1), pageBreakInside: 'avoid' }}>
      <Typography variant="subtitle1" gutterBottom>
        <b>{service.name}</b>
      </Typography>
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
    </div>
  );
}

const Service = React.memo(WrappedService);

type ParamProps = {
  param: ServiceParameter;
  idx: number;
  pidx: number;
  disabled?: boolean;
  compressed?: boolean;
  hasResetButton?: boolean;
  setParam: (service_id: number, param_id: number, param_value: any) => void;
  isSelected?: (name: string) => boolean;
};

function WrappedParam({ disabled, param, pidx, idx, hasResetButton = false, setParam }: ParamProps) {
  const classes = useStyles();
  const theme = useTheme();

  const [value, setValue] = useState<any>(param.value);
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
        <div style={{ paddingLeft: theme.spacing(1) }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                disabled={disabled}
                checked={param.value === 'true' || param.value === true}
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
            className={!disabled ? classes.item : null}
          />
        </div>
      ) : (
        <>
          <div>
            <Typography variant="caption" gutterBottom style={{ textTransform: 'capitalize' }}>
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
              fullWidth
              value={param.value}
              onChange={event => setParam(idx, pidx, event.target.value)}
            />
          ) : (
            <TextField
              variant="outlined"
              disabled={disabled}
              type="number"
              size="small"
              fullWidth
              value={parsedValue}
              onChange={handleIntChange}
            />
          )}
        </>
      )}
    </div>
  );
}

const Param = React.memo(WrappedParam);

type ServiceSpecProps = {
  service_spec: ServiceSpecification[];
  setParam: (service_id: number, param_id: number, param_value: any) => void;
  isSelected?: (name: string) => boolean;
  disabled?: boolean;
  compressed?: boolean;
  hasResetButton?: boolean;
};

function WrappedServiceSpec({
  service_spec,
  setParam,
  isSelected = () => true,
  disabled = false,
  compressed = false,
  hasResetButton = false
}: ServiceSpecProps) {
  const theme = useTheme();
  return (
    <div
      style={
        compressed
          ? {
              paddingTop: theme.spacing(2),
              paddingBottom: theme.spacing(2),
              columnWidth: '18rem',
              columnGap: '1rem',
              columnRuleWidth: '1px',
              columnRuleStyle: 'dotted',
              columnRuleColor: theme.palette.divider
            }
          : null
      }
    >
      {service_spec.map(
        (service, idx) =>
          isSelected(service.name) && (
            <Service
              key={idx}
              disabled={disabled}
              service={service}
              idx={idx}
              hasResetButton={hasResetButton}
              setParam={setParam}
            />
          )
      )}
    </div>
  );
}

const ServiceSpec = React.memo(WrappedServiceSpec);
export default ServiceSpec;
