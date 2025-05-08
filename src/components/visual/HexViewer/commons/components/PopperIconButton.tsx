import AdbIcon from '@mui/icons-material/Adb';
import type { SxProps } from '@mui/material';
import { ClickAwayListener, Fade, Popper, useTheme } from '@mui/material';
import { isEscape } from 'commons/components/utils/keyboard';
import type { CSSProperties } from 'react';
import { default as React, forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { TooltipIconButton } from '.';

export type PopperIconButtonProps = {
  id?: string;
  slotSX?: {
    iconButton: SxProps;
    paper: CSSProperties;
  };
  title?: string;
  icon?: React.ReactElement;
  field?: React.ReactElement;
  disabled?: boolean;
  size?: 'small' | 'medium';
  placement?:
    | 'bottom-end'
    | 'bottom-start'
    | 'bottom'
    | 'left-end'
    | 'left-start'
    | 'left'
    | 'right-end'
    | 'right-start'
    | 'right'
    | 'top-end'
    | 'top-start'
    | 'top';
};

export const WrappedPopperIconButton = (
  {
    id = '',
    slotSX = {
      iconButton: null,
      paper: null
    },
    title = '',
    icon = <AdbIcon />,
    field = <input />,
    disabled = false,
    size = 'small',
    placement = 'bottom'
  }: PopperIconButtonProps,
  ref: React.Ref<any>
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
      },
      close: (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(null);
        setOpen(false);
      }
    }),
    []
  );

  const handleOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  }, []);

  const handleClickAway = useCallback((event: MouseEvent | TouchEvent) => {
    setOpen(false);
    setAnchorEl(null);
  }, []);

  const handleCloseKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isEscape(event.key)) return;
    setOpen(false);
    setAnchorEl(null);
  }, []);

  return (
    <>
      <TooltipIconButton
        title={title}
        icon={icon}
        disabled={disabled}
        size={size}
        onClick={handleOpen}
        slotSX={{ iconButton: slotSX?.iconButton }}
      />
      <Popper open={open} anchorEl={anchorEl} placement={placement} transition disablePortal={true}>
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClickAway}>
            <Fade {...TransitionProps} timeout={200}>
              <div
                onKeyDown={handleCloseKeyDown}
                style={{
                  marginTop: '16px',
                  padding: theme.spacing(0),
                  minWidth: '200px',
                  backgroundColor: theme.palette.background.paper,
                  ...slotSX?.paper
                }}
              >
                {field}
              </div>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
};

export const PopperIconButton = React.memo(forwardRef(WrappedPopperIconButton));

export default PopperIconButton;
