import { Search } from '@mui/icons-material';
import {
  Box,
  ClickAwayListener,
  Dialog,
  DialogContent,
  DialogTitle,
  emphasize,
  IconButton,
  Popper,
  Slide,
  Stack,
  styled,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';

import { useAppSearchService } from 'commons/components/app/hooks/useAppSearchService';
import AppSearchInput from 'commons/components/search/AppSearchInput';
import AppSearchResult from 'commons/components/search/AppSearchResult';
import { parseEvent } from 'commons/components/utils/keyboard';
import { type ChangeEvent, forwardRef, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const MENU_LIST_SX = { maxHeight: 500, overflow: 'auto' };

const AppSearchRoot = styled(Box, { shouldForwardProp: prop => prop !== 'menuOpen' })<{ menuOpen: boolean }>(({
  theme,
  menuOpen
}) => {
  const backgroundColor = emphasize(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.1 : 0.033);
  return {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    borderBottomLeftRadius: menuOpen && 0,
    borderBottomRightRadius: menuOpen && 0,

    '.app-search-input': {
      backgroundColor:
        theme.palette.mode === 'dark' ? backgroundColor : menuOpen ? theme.palette.background.default : backgroundColor,
      boxShadow: menuOpen && theme.shadows[4]
    },
    '.app-search-result': {
      backgroundColor: theme.palette.mode === 'dark' ? backgroundColor : theme.palette.background.default,
      borderBottomLeftRadius: theme.shape.borderRadius,
      borderBottomRightRadius: theme.shape.borderRadius,
      boxShadow: menuOpen && theme.shadows[4],
      color: theme.palette.text.primary
    }
  };
});

const ModalTransition = forwardRef(function Transition(props: any, ref: any) {
  const { children, ..._props } = props;
  return (
    <Slide direction="down" ref={ref} {..._props}>
      {children}
    </Slide>
  );
});

export default function AppSearch() {
  const theme = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const isPhoneMode = useMediaQuery(theme.breakpoints.only('xs'));
  const isTabletMode = useMediaQuery(theme.breakpoints.only('sm'));
  const { t } = useTranslation();
  const { provided, state, service } = useAppSearchService();
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (service.onMounted) {
      service.onMounted(setValue, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keyboard[window] handler.
  // this is to trigger the CTLR+K shortcut to appsearch.
  useEffect(() => {
    const keyHandler = event => {
      const { key, isCtrl } = parseEvent(event);
      if (isCtrl && key === 'k') {
        event.preventDefault();
        const inputRef = menuRef.current.querySelector('input');
        if (!inputRef || isPhoneMode) {
          state.set({ ...state, menu: state.menu || isPhoneMode, mode: 'fullscreen' });
        } else {
          inputRef.focus();
        }
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
    };
  }, [provided, isPhoneMode, state]);

  // Search input focus handler.
  const onFocus = useCallback(() => {
    state.set({ ...state, menu: true, focused: true });
  }, [state]);

  // Search input focus handler.
  const onBlur = useCallback(() => {
    state.set({ ...state, focused: false });
  }, [state]);

  // Search input change handler.
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.currentTarget.value);
      if (service.onChange) {
        service.onChange(event.currentTarget.value, state, setValue);
      }
    },
    [service, state]
  );

  // keyboard[ENTER] handler.
  const onEnter = useCallback(() => {
    if (service.onEnter) {
      if (state.autoReset) {
        const inputRef = menuRef.current.querySelector('input');
        let newFocus = true;
        if (inputRef) {
          inputRef.blur();
          newFocus = false;
        }
        state.set({ ...state, menu: false, mode: 'inline', focused: newFocus });
        setValue('');
      } else {
        state.set({ ...state, menu: true });
      }
      service.onEnter(value, state);
    }
  }, [value, state, service]);

  // Keyboard handler.
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const { isEnter, isEscape, isTab, isArrowDown } = parseEvent(event);
      if (isEnter) {
        onEnter();
      } else if (isEscape || isTab) {
        setTimeout(() => menuRef.current.querySelector('input')?.blur(), 50);
        state.set({ ...state, menu: false });
      } else if (isArrowDown) {
        const result = document.querySelector('[data-tui-id="tui-app-search-result"]') as HTMLElement;
        if (result) {
          // Prevent scolling before menu list gets focus.
          // Doing this prevents the menu list from scrolling down
          //  and then back up on second arrow down.
          event.preventDefault(); // prevent native scroll.
          result.focus();
        }
      }
    },
    [state, onEnter]
  );

  // Clear search input handler.
  const onClear = useCallback(() => {
    setValue('');
    state.set({ ...state, items: null });
  }, [state]);

  // Fullscreen modal toggle handler.
  const onToggleFullscreen = useCallback(() => {
    state.set({
      ...state,
      menu: state.menu || isPhoneMode,
      mode: state.mode === 'inline' ? 'fullscreen' : 'inline'
    });
  }, [isPhoneMode, state]);

  return (
    <ClickAwayListener onClickAway={() => state.set({ ...state, menu: false })}>
      <AppSearchRoot
        ref={menuRef}
        sx={{ mr: isPhoneMode ? 0 : 1, display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}
        menuOpen={state.menu}
      >
        {isPhoneMode ? (
          <IconButton
            color="inherit"
            size="large"
            onClick={() => state.set({ ...state, menu: !state.menu, mode: 'fullscreen' })}
          >
            <Tooltip
              title={
                <Stack direction="column" textAlign="center">
                  <span>{t('app.search.fullscreen')}</span> <span>CTLR+K</span>
                </Stack>
              }
            >
              <Search />
            </Tooltip>
          </IconButton>
        ) : (
          <>
            <AppSearchInput
              autoFocus={false}
              focused={state.focused}
              showToggle
              provided={provided}
              className="app-search-input"
              value={value}
              searching={state.searching}
              open={state.menu}
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onClear={onClear}
              onToggleFullscreen={onToggleFullscreen}
              minWidth={isTabletMode ? '100%' : '250px'}
              maxWidth={isTabletMode ? '100%' : '350px'}
            />
            {provided && (
              <Popper
                open={state.menu && state.mode === 'inline'}
                anchorEl={menuRef.current}
                placement="bottom-end"
                sx={_theme => ({ width: '100%', zIndex: _theme.zIndex.appBar + 1 })}
                disablePortal
              >
                <AppSearchResult className="app-search-result" sx={MENU_LIST_SX} />
              </Popper>
            )}
          </>
        )}
        <Dialog
          disableRestoreFocus
          fullWidth
          maxWidth="md"
          TransitionComponent={ModalTransition}
          open={state.menu && state.mode === 'fullscreen'}
          onClose={() => state.set({ ...state, mode: 'inline', menu: false })}
          sx={{
            maxHeight: '75%',
            margin: 0,
            '.MuiDialog-container': {
              alignItems: 'start'
            }
          }}
          PaperProps={{
            sx: {
              borderRadius: 0,
              margin: 0,
              width: '100%'
            }
          }}
        >
          <DialogTitle
            sx={{
              padding: theme.spacing(1, 1.5)
            }}
          >
            <AppSearchInput
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              focused={state.focused}
              className="app-search-input"
              style={{ backgroundColor: emphasize(theme.palette.background.default, 0.1) }}
              showToggle={false}
              value={value}
              searching={state.searching}
              open={false}
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onClear={onClear}
              onToggleFullscreen={onToggleFullscreen}
            />
          </DialogTitle>
          {provided && state.items && (
            <DialogContent>
              <AppSearchResult />
            </DialogContent>
          )}
        </Dialog>
      </AppSearchRoot>
    </ClickAwayListener>
  );
}
