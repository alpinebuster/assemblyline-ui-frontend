import { ClearOutlined } from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import YoutubeSearchedForIcon from '@mui/icons-material/YoutubeSearchedFor';
import { Divider, Grid, IconButton, MenuItem, Skeleton, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { Badlist } from 'components/models/base/badlist';
import { ATTRIBUTION_TYPES, DEFAULT_TEMP_ATTRIBUTION } from 'components/models/base/badlist';
import Classification from 'components/visual/Classification';
import ConfirmationDialog from 'components/visual/ConfirmationDialog';
import CustomChip from 'components/visual/CustomChip';
import DatePicker from 'components/visual/DatePicker';
import Histogram from 'components/visual/Histogram';
import InputDialog from 'components/visual/InputDialog';
import Moment from 'components/visual/Moment';
import { bytesToSize, safeFieldValue, safeFieldValueURI } from 'helpers/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Link, useParams } from 'react-router-dom';
import ForbiddenPage from 'components/routes/403';

type ParamProps = {
  id: string;
};

type BadlistDetailProps = {
  badlist_id?: string;
  close?: () => void;
};

const BadlistDetail = ({ badlist_id = null, close = () => null }: BadlistDetailProps) => {
  const { t, i18n } = useTranslation(['manageBadlistDetail']);
  const { id } = useParams<ParamProps>();
  const theme = useTheme();
  const [badlist, setBadlist] = useState<Badlist>(null);
  const [histogram, setHistogram] = useState<Record<string, number>>(null);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [waitingDialog, setWaitingDialog] = useState<boolean>(false);
  const [enableDialog, setEnableDialog] = useState<boolean>(false);
  const [addAttributionDialog, setAddAttributionDialog] = useState<boolean>(false);
  const [disableDialog, setDisableDialog] = useState<boolean>(false);
  const [removeAttributionDialog, setRemoveAttributionDialog] = useState(null);
  const [removeSourceData, setRemoveSourceData] = useState(null);
  const [addAttributionData, setAddAttributionData] = useState({ ...DEFAULT_TEMP_ATTRIBUTION });
  const { user: currentUser, c12nDef } = useALContext();
  const { showSuccessMessage } = useMySnackbar();
  const { apiCall } = useMyAPI();
  const navigate = useNavigate();

  useEffect(() => {
    if ((badlist_id || id) && currentUser.roles.includes('badlist_view')) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badlist_id, id]);

  const reload = () => {
    apiCall({
      url: `/api/v4/badlist/${badlist_id || id}/`,
      onSuccess: api_data => {
        setBadlist(api_data.api_response);
      }
    });
  };

  useEffect(() => {
    if (badlist && currentUser.roles.includes('submission_view')) {
      apiCall({
        method: 'POST',
        url: '/api/v4/search/histogram/result/created/',
        body: {
          query:
            badlist.type === 'file'
              ? `result.sections.heuristic.signature.name:"BADLIST_${badlist_id || id}"`
              : `result.sections.tags.${badlist.tag.type}:${safeFieldValue(badlist.tag.value)}`,
          mincount: 0,
          start: 'now-30d/d',
          end: 'now+1d/d-1s',
          gap: '+1d'
        },
        onSuccess: api_data => {
          setHistogram(api_data.api_response);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badlist]);

  const removeBadlist = () => {
    apiCall({
      url: `/api/v4/badlist/${badlist_id || id}/`,
      method: 'DELETE',
      onSuccess: () => {
        setDeleteDialog(false);
        showSuccessMessage(t('delete.success'));
        if (id) {
          setTimeout(() => navigate('/manage/badlist'), 1000);
        }
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        close();
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const enableHash = () => {
    apiCall({
      body: true,
      url: `/api/v4/badlist/enable/${badlist_id || id}/`,
      method: 'PUT',
      onSuccess: () => {
        setEnableDialog(false);
        showSuccessMessage(t('enable.success'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        setBadlist({ ...badlist, enabled: true });
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const disableHash = () => {
    apiCall({
      body: false,
      url: `/api/v4/badlist/enable/${badlist_id || id}/`,
      method: 'PUT',
      onSuccess: () => {
        setDisableDialog(false);
        showSuccessMessage(t('disable.success'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        setBadlist({ ...badlist, enabled: false });
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const handleExpiryDateChange = date => {
    apiCall({
      body: date,
      url: `/api/v4/badlist/expiry/${badlist_id || id}/`,
      method: date ? 'PUT' : 'DELETE',
      onSuccess: () => {
        setDisableDialog(false);
        showSuccessMessage(t(date ? 'expiry.update.success' : 'expiry.clear.success'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('reloadBadlist')), 1000);
        setBadlist({ ...badlist, expiry_ts: date });
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const handleClassificationChange = (classification, source, type) => {
    apiCall({
      body: classification,
      url: `/api/v4/badlist/classification/${badlist_id || id}/${source}/${type}/`,
      method: 'PUT',
      onSuccess: () => {
        showSuccessMessage(t('classification.update.success'));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reloadBadlist'));
          reload();
        }, 1000);
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const deleteSource = () => {
    apiCall({
      url: `/api/v4/badlist/source/${badlist_id || id}/${removeSourceData.name}/${removeSourceData.type}/`,
      method: 'DELETE',
      onSuccess: () => {
        showSuccessMessage(t('remove.source.success'));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reloadBadlist'));
          reload();
        }, 1000);
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => {
        setWaitingDialog(false);
        setRemoveSourceData(null);
      }
    });
  };

  const deleteAttribution = () => {
    apiCall({
      url: `/api/v4/badlist/attribution/${badlist_id || id}/${removeAttributionDialog.type}/${
        removeAttributionDialog.value
      }/`,
      method: 'DELETE',
      onSuccess: () => {
        setRemoveAttributionDialog(null);
        showSuccessMessage(t('remove.attribution.success'));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reloadBadlist'));
          reload();
        }, 1000);
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  const addAttribution = () => {
    apiCall({
      url: `/api/v4/badlist/attribution/${badlist_id || id}/${addAttributionData.type}/${addAttributionData.value}/`,
      method: 'PUT',
      onSuccess: () => {
        setAddAttributionDialog(false);
        showSuccessMessage(t('add.attribution.success'));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reloadBadlist'));
          setAddAttributionData({ ...DEFAULT_TEMP_ATTRIBUTION });
          reload();
        }, 1000);
      },
      onEnter: () => setWaitingDialog(true),
      onExit: () => setWaitingDialog(false)
    });
  };

  return currentUser.roles.includes('badlist_view') ? (
    <PageCenter margin={!id ? 2 : 4} width="100%">
      <ConfirmationDialog
        open={deleteDialog}
        handleClose={() => setDeleteDialog(false)}
        handleAccept={removeBadlist}
        title={t('delete.title')}
        cancelText={t('delete.cancelText')}
        acceptText={t('delete.acceptText')}
        text={t('delete.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={enableDialog}
        handleClose={() => setEnableDialog(false)}
        handleAccept={enableHash}
        title={t('enable.title')}
        cancelText={t('enable.cancelText')}
        acceptText={t('enable.acceptText')}
        text={t('enable.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={disableDialog}
        handleClose={() => setDisableDialog(false)}
        handleAccept={disableHash}
        title={t('disable.title')}
        cancelText={t('disable.cancelText')}
        acceptText={t('disable.acceptText')}
        text={t('disable.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={removeAttributionDialog !== null}
        handleClose={() => setRemoveAttributionDialog(null)}
        handleAccept={deleteAttribution}
        title={t('remove.attribution.title')}
        cancelText={t('remove.attribution.cancelText')}
        acceptText={t('remove.attribution.acceptText')}
        text={t('remove.attribution.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={removeSourceData !== null}
        handleClose={() => setRemoveSourceData(null)}
        handleAccept={deleteSource}
        title={t('remove.source.title')}
        cancelText={t('remove.source.cancelText')}
        acceptText={t('remove.source.acceptText')}
        text={t('remove.source.text')}
        waiting={waitingDialog}
      />
      <InputDialog
        open={addAttributionDialog}
        handleClose={() => setAddAttributionDialog(false)}
        handleAccept={addAttribution}
        title={t('add.attribution.title')}
        cancelText={t('add.attribution.cancelText')}
        acceptText={t('add.attribution.acceptText')}
        text={t('add.attribution.text')}
        waiting={waitingDialog}
        handleInputChange={event => setAddAttributionData({ ...addAttributionData, value: event.target.value })}
        inputValue={addAttributionData.value}
        inputLabel={t('add.attribution.inputlabel')}
        outLabel
        extra={
          <>
            <Typography variant="overline">{t('add.attribution.categorylabel')}</Typography>
            <TextField
              size="small"
              value={addAttributionData.type}
              variant="outlined"
              onChange={event => setAddAttributionData({ ...addAttributionData, type: event.target.value })}
              fullWidth
              select
            >
              {ATTRIBUTION_TYPES.map((item, i) => (
                <MenuItem key={i} value={item}>
                  {t(`attribution.${item}`)}
                </MenuItem>
              ))}
            </TextField>
          </>
        }
      />

      {c12nDef.enforce && (
        <div style={{ paddingBottom: theme.spacing(4) }}>
          <Classification type="outlined" c12n={badlist ? badlist.classification : null} format="long" />
        </div>
      )}
      <div style={{ textAlign: 'left' }}>
        <div style={{ paddingBottom: theme.spacing(4) }}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs>
              <Typography variant="h4">{badlist ? t(`title.${badlist.type}`) : t('title')}</Typography>
              <Typography variant="caption" style={{ wordBreak: 'break-word' }}>
                {badlist ? badlist_id || id : <Skeleton style={{ width: '10rem' }} />}
              </Typography>
            </Grid>
            <Grid item xs={12} sm style={{ textAlign: 'right', flexGrow: 0 }}>
              {badlist ? (
                <>
                  {(badlist_id || id) && (
                    <div style={{ display: 'flex', marginBottom: theme.spacing(1) }}>
                      {currentUser.roles.includes('submission_view') && (
                        <Tooltip title={t('usage')}>
                          <IconButton
                            component={Link}
                            style={{
                              color: theme.palette.action.active
                            }}
                            to={
                              badlist.type === 'file'
                                ? `/search/?query=sha256:${badlist.hashes.sha256 || badlist_id || id} OR results:${
                                    badlist.hashes.sha256 || badlist_id || id
                                  }* OR errors:${badlist.hashes.sha256 || badlist_id || id}* OR file.sha256:${
                                    badlist.hashes.sha256 || badlist_id || id
                                  }`
                                : `/search/result/?query=result.sections.tags.${badlist.tag.type}:${safeFieldValueURI(
                                    badlist.tag.value
                                  )}`
                            }
                            size="large"
                          >
                            <YoutubeSearchedForIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {currentUser.roles.includes('badlist_manage') && (
                        <Tooltip title={badlist.enabled ? t('enabled') : t('disabled')}>
                          <IconButton
                            onClick={badlist.enabled ? () => setDisableDialog(true) : () => setEnableDialog(true)}
                            size="large"
                          >
                            {badlist.enabled ? <ToggleOnIcon /> : <ToggleOffOutlinedIcon />}
                          </IconButton>
                        </Tooltip>
                      )}

                      {currentUser.roles.includes('badlist_manage') && (
                        <Tooltip title={t('remove')}>
                          <IconButton
                            style={{
                              color:
                                theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark
                            }}
                            onClick={() => setDeleteDialog(true)}
                            size="large"
                          >
                            <RemoveCircleOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex' }}>
                    <Skeleton variant="circular" height="3rem" width="3rem" style={{ margin: theme.spacing(0.5) }} />
                    {currentUser.roles.includes('badlist_manage') && (
                      <>
                        <Skeleton
                          variant="circular"
                          height="3rem"
                          width="3rem"
                          style={{ margin: theme.spacing(0.5) }}
                        />
                        <Skeleton
                          variant="circular"
                          height="3rem"
                          width="3rem"
                          style={{ margin: theme.spacing(0.5) }}
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </Grid>
          </Grid>
        </div>
        <Grid container spacing={3}>
          <Grid item xs={12} style={{ display: badlist && badlist.type === 'file' ? 'initial' : 'none' }}>
            <Typography variant="h6">{t('hashes')}</Typography>
            <Divider />
            <Grid container>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>MD5</span>
              </Grid>
              <Grid item xs={8} sm={9} style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {badlist ? (
                  badlist.hashes.md5 || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>SHA1</span>
              </Grid>
              <Grid item xs={8} sm={9} style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {badlist ? (
                  badlist.hashes.sha1 || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>SHA256</span>
              </Grid>
              <Grid item xs={8} sm={9} style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {badlist ? (
                  badlist.hashes.sha256 || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>SSDeep</span>
              </Grid>
              <Grid item xs={8} sm={9} style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {badlist ? (
                  badlist.hashes.ssdeep || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>TLSH</span>
              </Grid>
              <Grid item xs={8} sm={9} style={{ fontSize: '110%', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {badlist ? (
                  badlist.hashes.tlsh || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                ) : (
                  <Skeleton />
                )}
              </Grid>
            </Grid>
          </Grid>
          {badlist && badlist.file && (
            <Grid item xs={12}>
              <Typography variant="h6">{t('file.title')}</Typography>
              <Divider />
              <Grid container>
                <Grid item xs={4} sm={3}>
                  <span style={{ fontWeight: 500 }}>{t('file.name')}</span>
                </Grid>
                <Grid item xs={8} sm={9}>
                  {badlist ? badlist.file.name.map((name, i) => <div key={i}>{name}</div>) : <Skeleton />}
                </Grid>
                <Grid item xs={4} sm={3}>
                  <span style={{ fontWeight: 500 }}>{t('file.size')}</span>
                </Grid>
                <Grid item xs={8} sm={9}>
                  {badlist.file.size ? (
                    <span>
                      {badlist.file.size}
                      <span style={{ fontWeight: 300 }}> ({bytesToSize(badlist.file.size)})</span>
                    </span>
                  ) : (
                    <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>
                  )}
                </Grid>

                <Grid item xs={4} sm={3}>
                  <span style={{ fontWeight: 500 }}>{t('file.type')}</span>
                </Grid>
                <Grid item xs={8} sm={9} style={{ wordBreak: 'break-word' }}>
                  {badlist.file.type || <span style={{ color: theme.palette.text.disabled }}>{t('unknown')}</span>}
                </Grid>
              </Grid>
            </Grid>
          )}
          {badlist && badlist.tag && (
            <Grid item xs={12}>
              <Typography variant="h6">{t('tag.title')}</Typography>
              <Divider />
              <Grid container>
                <Grid item xs={4} sm={3}>
                  <span style={{ fontWeight: 500 }}>{t('tag.type')}</span>
                </Grid>
                <Grid item xs={8} sm={9}>
                  {badlist.tag.type}
                </Grid>
                <Grid item xs={4} sm={3}>
                  <span style={{ fontWeight: 500 }}>{t('tag.value')}</span>
                </Grid>
                <Grid item xs={8} sm={9} style={{ wordBreak: 'break-word' }}>
                  {badlist.tag.value}
                </Grid>
              </Grid>
            </Grid>
          )}
          <Grid item xs={12}>
            <Grid container alignItems={'end'}>
              <Grid item xs={11}>
                <Typography variant="h6">{t('attribution.title')}</Typography>
              </Grid>
              <Grid item xs={1} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                {currentUser.roles.includes('badlist_manage') &&
                  (badlist ? (
                    <Tooltip title={t('add.attribution')}>
                      <IconButton
                        style={{
                          color:
                            theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark
                        }}
                        onClick={() => setAddAttributionDialog(true)}
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Skeleton
                      variant="circular"
                      height="2.5rem"
                      width="2.5rem"
                      style={{ margin: theme.spacing(0.5) }}
                    />
                  ))}
              </Grid>
            </Grid>
            <Divider />
            {badlist &&
              (!badlist.attribution ||
                Object.keys(badlist.attribution).every(
                  k => !badlist.attribution[k] || badlist.attribution[k].length === 0
                )) && <span style={{ color: theme.palette.action.disabled }}>{t('attribution.empty')}</span>}
            {badlist &&
              badlist.attribution &&
              Object.keys(badlist.attribution)
                .filter(k => badlist.attribution[k] && badlist.attribution[k].length !== 0)
                .map((k, kid) => (
                  <Grid key={kid} container spacing={2}>
                    <Grid item xs={4} sm={3}>
                      <span style={{ fontWeight: 500 }}>{t(`attribution.${k}`)}</span>
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      {badlist.attribution[k].map((x, i) => (
                        <CustomChip
                          key={i}
                          label={x}
                          size="small"
                          variant="outlined"
                          onDelete={
                            currentUser.roles.includes('badlist_manage')
                              ? () => setRemoveAttributionDialog({ type: k, value: x })
                              : null
                          }
                        />
                      ))}
                    </Grid>
                  </Grid>
                ))}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">{t('sources')}</Typography>
            <Divider />
            {badlist ? (
              badlist.sources.map((src, src_id) => (
                <Grid key={src_id} container>
                  <Grid item xs={12} sm={3}>
                    <span style={{ fontWeight: 500 }}>
                      {src.name} ({t(src.type)})
                      {(currentUser.is_admin || currentUser.username === src.name) && badlist.sources.length !== 1 && (
                        <Tooltip title={t('remove.source.tooltip')}>
                          <IconButton
                            size="small"
                            onClick={() => setRemoveSourceData({ name: src.name, type: src.type })}
                          >
                            <ClearOutlined style={{ fontSize: theme.spacing(2) }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </span>
                  </Grid>
                  <Grid item xs={12} sm={c12nDef.enforce ? 7 : 9}>
                    {src.reason.map((reason, i) => (
                      <div key={i}>{reason}</div>
                    ))}
                  </Grid>
                  {c12nDef.enforce && (
                    <Grid item xs={12} sm={2}>
                      <Classification
                        fullWidth
                        size="small"
                        format="short"
                        c12n={src.classification}
                        type={currentUser.is_admin || currentUser.username === src.name ? 'picker' : 'outlined'}
                        setClassification={
                          currentUser.is_admin || currentUser.username === src.name
                            ? classification => handleClassificationChange(classification, src.name, src.type)
                            : null
                        }
                      />
                    </Grid>
                  )}
                </Grid>
              ))
            ) : (
              <Skeleton />
            )}
          </Grid>
          <Grid item xs={12}>
            <Grid container alignItems={'end'}>
              <Grid item xs={11}>
                <Typography variant="h6">{t('timing')}</Typography>
              </Grid>
              <Grid item xs={1} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                {currentUser.roles.includes('badlist_manage') &&
                  (badlist ? (
                    <DatePicker
                      date={badlist.expiry_ts}
                      setDate={handleExpiryDateChange}
                      tooltip={t('expiry.change')}
                      defaultDateOffset={1}
                      minDateTomorrow
                    />
                  ) : (
                    <Skeleton
                      variant="circular"
                      height="2.5rem"
                      width="2.5rem"
                      style={{ margin: theme.spacing(0.5) }}
                    />
                  ))}
              </Grid>
            </Grid>
            <Divider />
            <Grid container>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>{t('timing.added')}</span>
              </Grid>
              <Grid item xs={8} sm={9}>
                {badlist ? (
                  <div>
                    <Moment format="YYYY-MM-DD">{badlist.added}</Moment>&nbsp; (
                    <Moment variant="fromNow">{badlist.added}</Moment>)
                  </div>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>{t('timing.updated')}</span>
              </Grid>
              <Grid item xs={8} sm={9}>
                {badlist ? (
                  <div>
                    <Moment format="YYYY-MM-DD">{badlist.updated}</Moment>&nbsp; (
                    <Moment variant="fromNow">{badlist.updated}</Moment>)
                  </div>
                ) : (
                  <Skeleton />
                )}
              </Grid>
              <Grid item xs={4} sm={3}>
                <span style={{ fontWeight: 500 }}>{t('timing.expiry_ts')}</span>
              </Grid>
              <Grid item xs={8} sm={9}>
                {badlist ? (
                  badlist.expiry_ts ? (
                    <div>
                      <Moment format="YYYY-MM-DD">{badlist.expiry_ts}</Moment>&nbsp; (
                      <Moment variant="fromNow">{badlist.expiry_ts}</Moment>)
                    </div>
                  ) : (
                    <span style={{ color: theme.palette.action.disabled }}>{t('expiry.forever')}</span>
                  )
                ) : (
                  <Skeleton />
                )}
              </Grid>
            </Grid>
          </Grid>
          {currentUser.roles.includes('submission_view') && (
            <Grid item xs={12}>
              <Histogram
                dataset={histogram}
                height="300px"
                isDate
                title={t('chart.title')}
                datatype={badlist_id || id}
                verticalLine
              />
            </Grid>
          )}
        </Grid>
      </div>
    </PageCenter>
  ) : (
    <ForbiddenPage />
  );
};

export default BadlistDetail;
