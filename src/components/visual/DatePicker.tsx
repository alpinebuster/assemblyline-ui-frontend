import { Button, Dialog, DialogActions, IconButton, TextField, Tooltip, useTheme } from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import EventIcon from '@mui/icons-material/Event';
import { LocalizationProvider, DatePicker as MuiDatePicker, StaticDatePicker } from '@mui/x-date-pickers';
import { useEffectOnce } from 'commons/components/utils/hooks/useEffectOnce';
import moment from 'moment';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface DatePickerProps {
  date: string;
  setDate: (date: string) => void;
  tooltip?: string;
  type?: 'button' | 'input';
  defaultDateOffset?: number | null;
  textFieldProps?: any;
  minDateTomorrow?: boolean;
  maxDateToday?: boolean;
  disabled?: boolean;
}

function WrappedDatePicker({
  date,
  setDate,
  tooltip = null,
  type = 'button',
  defaultDateOffset = null,
  textFieldProps = {},
  minDateTomorrow = false,
  maxDateToday = false,
  disabled = false
}: DatePickerProps) {
  const [tempDate, setTempDate] = React.useState(null);
  const [tomorrow, setTomorrow] = React.useState(null);
  const [today, setToday] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffectOnce(() => {
    const tempTomorrow = new Date();
    tempTomorrow.setDate(tempTomorrow.getDate() + 1);
    tempTomorrow.setHours(0, 0, 0, 0);
    setTomorrow(moment(tempTomorrow));

    const tempToday = new Date();
    tempToday.setDate(tempToday.getDate() + 1);
    tempToday.setHours(0, 0, 0, 0);
    setToday(moment(tempToday));

    if (defaultDateOffset) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + defaultDateOffset);
      defaultDate.setHours(0, 0, 0, 0);
      setDate(moment(defaultDate).format('YYYY-MM-DDThh:mm:ss.SSSSSS') + 'Z');
    }
  });

  useEffect(() => {
    if (date === null && defaultDateOffset) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + defaultDateOffset);
      defaultDate.setHours(0, 0, 0, 0);
      setTempDate(moment(defaultDate));
    } else if (date) {
      setTempDate(moment(date));
    } else if (date === undefined || date === null) {
      setTempDate(null);
    }
  }, [date, defaultDateOffset]);

  // Build chip based on computed values
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      {type === 'button' ? (
        <>
          <Tooltip title={tooltip ? tooltip : t('date.open')}>
            <IconButton onClick={handleOpen}>
              <EventIcon />
            </IconButton>
          </Tooltip>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={tempDate}
              onChange={newValue => {
                setTempDate(newValue);
              }}
              renderInput={params => <TextField {...params} />}
              minDate={minDateTomorrow ? tomorrow : null}
              maxDate={maxDateToday ? today : null}
            />
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                style={{ margin: theme.spacing(1) }}
                onClick={() => {
                  setDate(null);
                  handleClose();
                }}
                color="secondary"
              >
                {t('date.clear')}
              </Button>
              <DialogActions>
                <Button
                  onClick={() => {
                    handleClose();
                  }}
                  color="secondary"
                >
                  {t('date.cancel')}
                </Button>
                <Button
                  onClick={() => {
                    setDate(tempDate.isValid() ? `${tempDate.format('YYYY-MM-DDThh:mm:ss.SSSSSS')}Z` : null);
                    handleClose();
                  }}
                  color="primary"
                  autoFocus
                  disabled={tempDate === null}
                >
                  {t('date.select')}
                </Button>
              </DialogActions>
            </div>
          </Dialog>
        </>
      ) : (
        <MuiDatePicker
          value={tempDate}
          onChange={newValue => {
            setTempDate(newValue);
            setDate(newValue && newValue.isValid() ? `${newValue.format('YYYY-MM-DDThh:mm:ss.SSSSSS')}Z` : null);
          }}
          renderInput={({ inputRef, inputProps, InputProps }) => (
            <TextField
              size="small"
              label={tooltip ? tooltip : null}
              ref={inputRef}
              inputProps={{ ...inputProps }}
              InputProps={{ ...InputProps }}
              {...textFieldProps}
            />
          )}
          minDate={minDateTomorrow ? tomorrow : null}
          maxDate={maxDateToday ? today : null}
          disabled={disabled}
        />
      )}
    </LocalizationProvider>
  );
}

const DatePicker = React.memo(WrappedDatePicker);
export default DatePicker;
