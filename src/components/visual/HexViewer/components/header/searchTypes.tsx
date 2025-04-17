import NavigationIcon from '@mui/icons-material/Navigation';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { Fade, ListItemButton, Paper, Popper, useTheme } from '@mui/material';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { isEscape } from 'commons/components/utils/keyboard';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchType, StoreProps, useDispatch, useEventListener } from '../..';
import { TooltipIconButton } from '../../commons/components';

export const WrappedHexSearchTypes = ({ store }: StoreProps) => {
  const theme = useTheme();
  const { t } = useTranslation(['hexViewer']);
  const { onSearchTypeChange } = useDispatch();
  const { type: searchType } = store.search.mode;

  const ref = useRef<HTMLDivElement>(null);
  const [popperAnchorEl, setPopperAnchorEl] = useState(null);
  const isPopperOpen = !!popperAnchorEl;

  const handleClickAway = useCallback(
    (event: any) => {
      if (ref?.current?.contains(event.target) || !isPopperOpen) return;
      setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget);
    },
    [isPopperOpen, popperAnchorEl]
  );

  const handleClick = useCallback(
    (_type: SearchType) => (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      onSearchTypeChange({ type: _type });
      setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget);
    },
    [onSearchTypeChange, popperAnchorEl]
  );

  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget);
    },
    [popperAnchorEl]
  );

  const handleCloseKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isEscape(event.key)) return;
      setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget);
    },
    [popperAnchorEl]
  );

  useEventListener('mousedown', event => handleClickAway(event));

  return (
    <div ref={ref} onKeyDown={handleCloseKeyDown}>
      <TooltipIconButton
        title={t('search.modes')}
        size="small"
        icon={
          searchType === 'cursor' ? (
            <NavigationIcon />
          ) : searchType === 'hex' ? (
            <NumbersOutlinedIcon />
          ) : searchType === 'text' ? (
            <TextFieldsIcon />
          ) : null
        }
        disabled={false}
        onClick={handleOpen}
      />
      <Popper
        open={isPopperOpen}
        anchorEl={popperAnchorEl}
        placement="bottom-start"
        disablePortal={true}
        transition
        sx={{
          zIndex: theme.zIndex.appBar + 200,
          minWidth: '280px',
          marginTop: '16px',
          padding: theme.spacing(0),
          backgroundColor: theme.palette.background.paper
        }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={250}>
            <Paper style={{ padding: theme.spacing(1) }} elevation={4}>
              <List component="nav" aria-label="main mailbox folders" dense disablePadding>
                <ListItemButton
                  selected={searchType === 'cursor'}
                  autoFocus={searchType === 'cursor'}
                  dense
                  onClick={handleClick('cursor')}
                >
                  <ListItemIcon children={<NavigationIcon />} />
                  <ListItemText primary={t('header.selector.cursor')} />
                </ListItemButton>
                <ListItemButton
                  selected={searchType === 'hex'}
                  autoFocus={searchType === 'hex'}
                  dense
                  onClick={handleClick('hex')}
                >
                  <ListItemIcon children={<NumbersOutlinedIcon />} />
                  <ListItemText primary={t('header.selector.hexcode')} />
                </ListItemButton>
                <ListItemButton
                  selected={searchType === 'text'}
                  autoFocus={searchType === 'text'}
                  dense
                  onClick={handleClick('text')}
                >
                  <ListItemIcon children={<TextFieldsIcon />} />
                  <ListItemText primary={t('header.selector.text')} />
                </ListItemButton>
              </List>
            </Paper>
          </Fade>
        )}
      </Popper>
    </div>
  );
};

export const HexSearchTypes = React.memo(
  WrappedHexSearchTypes,
  (prevProps: Readonly<StoreProps>, nextProps: Readonly<StoreProps>) =>
    prevProps.store.search.mode === nextProps.store.search.mode
);
