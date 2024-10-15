import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { Retrohunt } from 'components/models/base/retrohunt';
import type { CustomUser } from 'components/models/ui/user';
import ForbiddenPage from 'components/routes/403';
import NotFoundPage from 'components/routes/404';
import Classification from 'components/visual/Classification';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(theme => ({
  circularProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  }
}));

type RetrohuntData = Pick<Retrohunt, 'key' | 'search_classification' | 'ttl'>;

type Props = {
  retrohunt: Retrohunt;
  onRepeat: (value: Retrohunt) => void;
};

function WrappedRetrohuntRepeat({ retrohunt = null, onRepeat = () => null }: Props) {
  const { t } = useTranslation(['retrohunt']);
  const theme = useTheme();
  const classes = useStyles();
  const { apiCall } = useMyAPI();
  const { c12nDef, configuration } = useALContext();
  const { user: currentUser } = useAppUser<CustomUser>();
  const { showSuccessMessage, showErrorMessage } = useMySnackbar();

  const [data, setData] = useState<RetrohuntData>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const maxDaysToLive = useMemo<number>(
    () => (!configuration.retrohunt.max_dtl ? null : configuration.retrohunt.max_dtl),
    [configuration.retrohunt.max_dtl]
  );

  const handleRepeat = useCallback(
    () => {
      if (!currentUser.roles.includes('retrohunt_run') && configuration?.retrohunt?.enabled) return;
      apiCall({
        method: 'POST',
        url: `/api/v4/retrohunt/repeat/`,
        body: {
          key: data.key,
          search_classification: data.search_classification,
          ttl: data.ttl
        },
        onSuccess: ({ api_response }) => {
          showSuccessMessage(t('repeat.success'));
          setOpen(false);
          onRepeat(api_response);
          setTimeout(() => window.dispatchEvent(new CustomEvent('reloadRetrohunts')), 1000);
        },
        onFailure: api_data => showErrorMessage(api_data.api_error_message),
        onEnter: () => setLoading(true),
        onExit: () => setLoading(false)
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configuration?.retrohunt?.enabled, currentUser.roles, retrohunt, showErrorMessage, showSuccessMessage, t]
  );

  useEffect(() => {
    if (open) {
      let ttl = Math.ceil((new Date(retrohunt.expiry_ts).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      ttl = Math.max(maxDaysToLive ? 1 : 0, Math.min(maxDaysToLive ? maxDaysToLive : 365, ttl));
      setData({ key: retrohunt.key, search_classification: retrohunt.search_classification, ttl: ttl });
    }
  }, [maxDaysToLive, open, retrohunt]);

  if (!configuration?.retrohunt?.enabled) return <NotFoundPage />;
  else if (!currentUser.roles.includes('retrohunt_run')) return <ForbiddenPage />;
  else
    return !retrohunt || !retrohunt.finished ? null : (
      <>
        <Tooltip title={t('repeat.tooltip')}>
          <div>
            <IconButton size="large" onClick={() => setOpen(o => !o)}>
              <ReplayOutlinedIcon />
            </IconButton>
          </div>
        </Tooltip>
        <Dialog open={open} onClose={() => setOpen(o => false)} fullWidth maxWidth="md">
          <DialogTitle>{t('repeat.title')}</DialogTitle>
          <DialogContent>
            {data && (
              <DialogContentText component="div">
                <Grid container flexDirection="column" spacing={2}>
                  <Grid item>
                    <span>{t('repeat.content1')}</span>
                    <b>{retrohunt.key}</b>
                    <span>{t('repeat.content2')}</span>
                  </Grid>

                  <Grid item style={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1) }}>
                    <InfoOutlinedIcon />
                    <span>{t('repeat.note')}</span>
                  </Grid>

                  {c12nDef.enforce && (
                    <Grid item>
                      <Tooltip title={t('tooltip.search_classification')} placement="top">
                        <div
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing(1),
                            marginBottom: theme.spacing(0.5)
                          }}
                        >
                          <Typography variant="subtitle2">{t('details.search_classification')}</Typography>
                          <InfoOutlinedIcon />
                        </div>
                      </Tooltip>
                      <Classification
                        format="long"
                        type="picker"
                        c12n={retrohunt.search_classification}
                        setClassification={(c12n: string) => setData(d => ({ ...d, search_classification: c12n }))}
                        disabled={loading}
                      />
                    </Grid>
                  )}

                  <Grid item flexGrow={2}>
                    <Typography variant="subtitle2">
                      {`${t('ttl')} (${maxDaysToLive ? `${t('ttl.max')}: ${maxDaysToLive}` : t('ttl.forever')})`}
                    </Typography>
                    <TextField
                      id="ttl"
                      type="number"
                      margin="dense"
                      size="small"
                      variant="outlined"
                      fullWidth
                      defaultValue={data.ttl}
                      disabled={loading}
                      inputProps={{ min: maxDaysToLive ? 1 : 0, max: maxDaysToLive ? maxDaysToLive : 365 }}
                      onChange={event => setData(d => ({ ...d, ttl: parseInt(event.target.value) }))}
                    />
                  </Grid>

                  <Grid item>{t('repeat.confirm')}</Grid>
                </Grid>
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={() => setOpen(false)}>
              {t('cancel')}
              {loading && <CircularProgress className={classes.circularProgress} size={24} />}
            </Button>
            <Button color="primary" disabled={loading} onClick={() => handleRepeat()}>
              {t('repeat.ok')}
              {loading && <CircularProgress className={classes.circularProgress} size={24} />}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
}

export const RetrohuntRepeat = React.memo(WrappedRetrohuntRepeat);
export default WrappedRetrohuntRepeat;
