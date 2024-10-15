import Editor, { DiffEditor, loader } from '@monaco-editor/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material';
import useAppTheme from 'commons/components/app/hooks/useAppTheme';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageFullSize from 'commons/components/pages/PageFullSize';
import { useEffectOnce } from 'commons/components/utils/hooks/useEffectOnce';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { CustomUser } from 'components/models/ui/user';
import { RouterPrompt } from 'components/visual/RouterPrompt';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactResizeDetector from 'react-resize-detector';
import { Navigate } from 'react-router';

loader.config({ paths: { vs: '/cdn/monaco_0.35.0/vs' } });

export default function AdminActions() {
  const { t, i18n } = useTranslation(['adminActions']);
  const theme = useTheme();
  const containerEL = useRef<HTMLDivElement>();
  const containerDialogEL = useRef<HTMLDivElement>();
  const [actions, setActions] = useState(null);
  const [originalActions, setOriginalActions] = useState(null);
  const [open, setOpen] = useState(false);
  const { showSuccessMessage } = useMySnackbar();
  const { apiCall } = useMyAPI();
  const { user: currentUser } = useAppUser<CustomUser>();
  const { isDark: isDarkTheme } = useAppTheme();

  useEffectOnce(() => {
    reload(false);
    // I cannot find a way to hot switch monaco editor's locale but at least I can load
    // the right language on first load...
    if (i18n.language === 'fr') {
      loader.config({ 'vs/nls': { availableLanguages: { '*': 'fr' } } });
    } else {
      loader.config({ 'vs/nls': { availableLanguages: { '*': '' } } });
    }
  });

  const reload = defValue => {
    if (currentUser.is_admin) {
      apiCall({
        method: 'GET',
        url: `/api/v4/system/actions/${defValue ? '?default' : ''}`,
        onSuccess: api_data => {
          setActions(api_data.api_response);
          if (!defValue) setOriginalActions(api_data.api_response);
          if (defValue && api_data.api_response !== originalActions) setOpen(true);
        }
      });
    }
  };

  const saveChanges = tagData => {
    setOpen(false);
    apiCall({
      method: 'PUT',
      url: '/api/v4/system/actions/',
      body: tagData,
      onSuccess: api_data => {
        reload(false);
        showSuccessMessage(t('save.success'));
      }
    });
  };

  const onMount = editor => {
    editor.focus();
  };

  return currentUser.is_admin ? (
    <PageFullSize margin={4}>
      <RouterPrompt when={actions !== originalActions} />

      <div style={{ marginBottom: theme.spacing(4), textAlign: 'left' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item style={{ flexGrow: 1 }}>
            <div>
              <Typography variant="h4">{t('title')}</Typography>
            </div>
          </Grid>
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <Button variant="outlined" onClick={() => reload(true)}>
                  {t('reset')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => setActions(originalActions)}
                  disabled={actions === originalActions}
                >
                  {t('undo')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={actions === originalActions}
                  onClick={() => setOpen(true)}
                >
                  {t('save')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="dialog-title" fullWidth maxWidth="md">
        <DialogTitle id="dialog-title">{t('save.title')}</DialogTitle>
        <DialogContent>
          <div style={{ border: `1px solid ${theme.palette.divider}` }}>
            <ReactResizeDetector handleWidth targetRef={containerDialogEL}>
              {({ width }) => (
                <div ref={containerDialogEL}>
                  <DiffEditor
                    language="yaml"
                    theme={isDarkTheme ? 'vs-dark' : 'vs'}
                    original={originalActions}
                    width={width}
                    height="50vh"
                    loading={t('loading')}
                    modified={actions}
                    options={{ links: false, renderSideBySide: false, readOnly: true }}
                  />
                </div>
              )}
            </ReactResizeDetector>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">
            {t('save.cancelText')}
          </Button>
          <Button onClick={() => saveChanges(actions)} color="primary">
            {t('save.acceptText')}
          </Button>
        </DialogActions>
      </Dialog>
      <div
        ref={containerEL}
        style={{
          flexGrow: 1,
          border: `1px solid ${theme.palette.divider}`,
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}
        >
          <ReactResizeDetector handleHeight handleWidth targetRef={containerEL}>
            {({ width, height }) => (
              <div ref={containerEL}>
                {actions !== null ? (
                  <>
                    <Editor
                      language="yaml"
                      width={width}
                      height={height}
                      theme={isDarkTheme ? 'vs-dark' : 'vs'}
                      loading={t('loading')}
                      value={actions}
                      onChange={setActions}
                      onMount={onMount}
                      options={{ links: false }}
                    />
                  </>
                ) : (
                  <Skeleton width={width} height={height} variant="rectangular" animation="wave" />
                )}
              </div>
            )}
          </ReactResizeDetector>
        </div>
      </div>
    </PageFullSize>
  ) : (
    <Navigate to="/forbidden" replace />
  );
}
