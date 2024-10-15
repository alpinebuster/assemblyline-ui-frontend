import ClearIcon from '@mui/icons-material/Clear';
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { makeStyles, useTheme } from '@mui/styles';
import useMyAPI from 'components/hooks/useMyAPI';
import type { Metadata } from 'components/models/base/config';
import DatePicker from 'components/visual/DatePicker';
import { matchURL } from 'helpers/utils';
import { useEffect, useState } from 'react';

interface MetadataInputFieldProps {
  name: string;
  configuration: Metadata;
  value: any;
  onChange: (value: any) => void;
  onReset?: () => void;
  disabled?: boolean;
}

const useStyles = makeStyles(theme => ({
  checkbox: {
    marginLeft: 0,
    width: '100%',
    '&:hover': {
      background: theme.palette.action.hover
    }
  }
}));

const isValid = (input: string, field_cfg: Metadata) => {
  if (!input) {
    // No input provided or is unset at the moment
    // Validity depends on whether or not the field is required
    return !field_cfg.required;
  }

  if (field_cfg.validator_type === 'boolean' || field_cfg.validator_type === 'enum') {
    // Limited selection so should always be valid
    return true;
  }

  if (field_cfg.validator_type === 'uri' && matchURL(input)) {
    return true;
  } else if (
    field_cfg.validator_type !== 'uri' &&
    input.match(new RegExp(field_cfg.validator_params.validation_regex))
  ) {
    return true;
  }
  return false;
};

const MetadataInputField: React.FC<MetadataInputFieldProps> = ({
  name,
  configuration,
  value,
  onChange,
  onReset = null,
  disabled = false
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const [options, setOptions] = useState([]);

  const { apiCall } = useMyAPI();

  useEffect(() => {
    if (disabled || configuration.validator_type in ['enum', 'boolean', 'integer', 'date']) {
      return;
    }

    apiCall({
      url: `/api/v4/search/facet/submission/metadata.${name}/`,
      onSuccess: api_data => {
        // Update with all possible values for field
        setOptions(Object.keys(api_data.api_response) as string[]);
      },
      onFailure: () => {
        // We can ignore failures here as this field might never have been set.
        return;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuration.validator_type, name, disabled]);

  // Default set of properties that apply to all text fields
  const defaultTextFieldProps = {
    id: `metadata.${name}`,
    margin: 'dense' as const,
    size: 'small' as const,
    variant: 'outlined' as const,
    onChange: (event: any) => onChange(event.target.value),
    required: configuration.required,
    fullWidth: true,
    value: value || '',
    error: !isValid(value, configuration),
    autoFocus: !isValid(value, configuration),
    disabled: disabled
  };

  const defaultAutoCompleteProps = {
    options: !disabled ? [...new Set([...options, ...configuration.suggestions])] : [],
    autoComplete: true,
    freeSolo: true,
    disableClearable: true,
    value: value || '',
    onInputChange: (_, v, __) => onChange(v),
    disabled: disabled
  };

  const header = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" style={{ textTransform: 'capitalize', width: '100%' }} color="textSecondary">
          {`${name.replace('_', ' ')} [ ${configuration.validator_type.toUpperCase()} ]`}
        </Typography>
        {onReset && value !== null && value !== undefined && !disabled && (
          <IconButton
            size="small"
            onClick={() => onReset()}
            style={{ marginTop: theme.spacing(-0.625), marginBottom: theme.spacing(-0.625) }}
          >
            <ClearIcon style={{ width: theme.spacing(2.5), height: theme.spacing(2.5) }} />
          </IconButton>
        )}
      </div>
    );
  };

  if (configuration.validator_type === 'boolean') {
    return (
      <FormControlLabel
        control={<Checkbox size="small" checked={value || false} name="label" onChange={() => onChange(!!!value)} />}
        disableTypography
        label={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" style={{ textTransform: 'capitalize' }}>
              {name.replace('_', ' ')}
            </Typography>
            {onReset && value !== null && value !== undefined && !disabled && (
              <IconButton
                size="small"
                onClick={event => {
                  onReset();
                  event.preventDefault();
                  event.stopPropagation();
                }}
                style={{ marginTop: theme.spacing(-0.625), marginBottom: theme.spacing(-0.625) }}
              >
                <ClearIcon style={{ width: theme.spacing(2.5), height: theme.spacing(2.5) }} />
              </IconButton>
            )}
          </div>
        }
        className={classes.checkbox}
        disabled={disabled}
      />
    );
  } else if (configuration.validator_type === 'enum') {
    return (
      <div>
        {header()}
        <TextField select {...defaultTextFieldProps}>
          {configuration.validator_params.values.map(v => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </TextField>
      </div>
    );
  } else if (configuration.validator_params?.validation_regex || configuration.validator_type === 'uri') {
    return (
      <div>
        {header()}
        <Tooltip
          title={configuration.validator_type === 'regex' ? configuration.validator_params?.validation_regex : null}
          placement="right"
        >
          <Autocomplete
            {...defaultAutoCompleteProps}
            renderInput={params => <TextField {...params} {...defaultTextFieldProps} />}
          />
        </Tooltip>
      </div>
    );
  } else if (configuration.validator_type === 'integer') {
    return (
      <div>
        {header()}
        <TextField
          {...defaultTextFieldProps}
          type="number"
          InputProps={{
            inputProps: { max: configuration.validator_params.max, min: configuration.validator_params.min }
          }}
        />
      </div>
    );
  } else if (configuration.validator_type === 'date') {
    return (
      <div>
        {header()}
        <DatePicker
          date={value}
          setDate={onChange}
          type="input"
          textFieldProps={{ ...defaultTextFieldProps }}
          disabled={disabled}
        />
      </div>
    );
  }
  return (
    <div>
      {header()}
      <Autocomplete
        {...defaultAutoCompleteProps}
        renderInput={params => <TextField {...params} {...defaultTextFieldProps} />}
      />
    </div>
  );
};

export default MetadataInputField;
