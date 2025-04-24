import { ClickAwayListener, Fade, Paper, Popper, useTheme } from '@mui/material';
import { isEnter, isEscape } from 'commons/components/utils/keyboard';
import { NumericField } from 'components/visual/HexViewer';
import { default as React, forwardRef, useCallback, useImperativeHandle, useState } from 'react';

export type NumberFieldPopperProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  value: number | string;
  min?: number;
  max?: number;
  base?: number;
  labelWidth?: number;
  onClickAway?: (event: MouseEvent | TouchEvent) => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onNumberChange?: (value: number) => void;
};

export const WrappedNumberFieldPopper = (
  {
    id = '',
    label = '',
    placeholder = '',
    value = null,
    min = 0,
    max = 1,
    base = 10,
    labelWidth = 0,
    onClickAway = () => null,
    onChange = () => null,
    onNumberChange = () => null
  }: NumberFieldPopperProps,
  ref
) => {
  const theme = useTheme();

  const [open, setOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
      }
    }),
    []
  );

  const handleClickAway = useCallback(
    (event: MouseEvent | TouchEvent) => {
      setOpen(false);
      setAnchorEl(null);
      onClickAway(event);
    },
    [onClickAway]
  );

  const handleCloseKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isEscape(event.key) && !isEnter(event.key)) return;
    setOpen(false);
    setAnchorEl(null);
  }, []);

  return (
    <Popper open={open} anchorEl={anchorEl} placement="bottom" transition>
      {({ TransitionProps }) => (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              sx={{
                marginTop: '16px',
                padding: theme.spacing(1),
                minWidth: '200px',
                backgroundColor: theme.palette.background.paper
              }}
            >
              <NumericField
                id={id}
                label={label}
                placeholder={placeholder}
                fullWidth
                size="small"
                margin="dense"
                value={value as number}
                labelWidth={labelWidth}
                min={min}
                max={max}
                base={base}
                onChange={event => onNumberChange(event.target.valueAsNumber as number)}
                onKeyDown={event => handleCloseKeyDown(event)}
              />
            </Paper>
          </Fade>
        </ClickAwayListener>
      )}
    </Popper>
  );
};

export const NumberFieldPopper = React.memo(forwardRef(WrappedNumberFieldPopper));

export default NumberFieldPopper;
