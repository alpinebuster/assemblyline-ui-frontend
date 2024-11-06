import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import {
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Skeleton from '@mui/material/Skeleton';
import makeStyles from '@mui/styles/makeStyles';
import PageCenter from 'commons/components/pages/PageCenter';
import { useEffectOnce } from 'commons/components/utils/hooks/useEffectOnce';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import ExternalSources from 'components/layout/externalSources';
import ServiceSpec from 'components/layout/serviceSpec';
import ServiceTree from 'components/layout/serviceTree';
import type { UserSettings } from 'components/models/base/user_settings';
import Classification from 'components/visual/Classification';
import { RouterPrompt } from 'components/visual/RouterPrompt';
import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(theme => ({
  drawer: {
    width: '500px',
    [theme.breakpoints.only('xs')]: {
      width: '100vw'
    }
  },
  row: {
    height: '62px'
  },
  group: {
    marginTop: '1rem'
  },
  skelItem: {
    display: 'inline-block'
  },
  skelButton: {
    display: 'inline-block',
    width: '9rem',
    height: '4rem'
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  }
}));

const DRAWER_TYPES = ['ttl', 'view', 'encoding', 'score', 'preferred_submission_profile'] as const;

type DrawerType = (typeof DRAWER_TYPES)[number];

function Skel() {
  return (
    <div>
      <Typography variant="subtitle1" gutterBottom>
        <Skeleton />
      </Typography>
      <Skeleton />
      <Skeleton style={{ height: '2.5rem' }} />
      <div style={{ display: 'flex', flexDirection: 'row', paddingBottom: '8px' }}>
        <Skeleton style={{ height: '2.5rem', width: '1.5rem' }} />
        <Skeleton style={{ marginLeft: '1rem', height: '2.5rem', width: '100%' }} />
      </div>
    </div>
  );
}

const ClickRow = ({ children, enabled, onClick, chevron = false, ...other }) => (
  <TableRow
    hover={enabled}
    style={{ cursor: enabled ? 'pointer' : 'default' }}
    onClick={enabled ? () => onClick() : null}
    {...other}
  >
    {children}

    {chevron && <TableCell align="right">{enabled && <ChevronRightOutlinedIcon />}</TableCell>}
  </TableRow>
);

function Settings() {
  const { t } = useTranslation(['settings']);
  const theme = useTheme();
  const classes = useStyles();
  const { apiCall } = useMyAPI();
  const { user: currentUser, c12nDef, configuration } = useALContext();
  const { showErrorMessage, showSuccessMessage } = useMySnackbar();

  const [settings, setSettings] = useState<UserSettings>(null);
  const [drawerType, setDrawerType] = useState<DrawerType>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [modified, setModified] = useState<boolean>(false);
  const [editable, setEditable] = useState<boolean>(false);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [submissionProfileTab, setSubmissionProfileTab] = useState<string>(settings?.preferred_submission_profile);

  const sp1 = theme.spacing(1);
  const sp2 = theme.spacing(2);
  const sp4 = theme.spacing(4);
  const sp6 = theme.spacing(6);

  const isXS = useMediaQuery(theme.breakpoints.only('xs'));

  const fileSources = useMemo<string[]>(
    () =>
      Object.values(configuration?.submission?.file_sources || {})
        .flatMap(file => file?.sources)
        .filter((value, index, array) => value && array.indexOf(value) === index),
    [configuration]
  );

  const setParam = (service_idx, param_idx, p_value) => {
    if (settings) {
      const newSettings = { ...settings };
      newSettings.service_spec[service_idx].params[param_idx].value = p_value;
      setSettings(newSettings);
      setModified(true);
    }
  };

  const setSubmissionProfileParam = (service_idx, param_idx, p_value) => {
    if (settings) {
      const newSettings = { ...settings };
      newSettings.submission_profiles[submissionProfileTab].service_spec[service_idx].params[param_idx].value = p_value;
      setSettings(newSettings);
      setModified(true);
    }
  };

  function setClassification(value) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, classification: value });
    }
  }

  function setTTL(value) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, ttl: parseInt(value) });
    }
  }

  function toggleDynamicPrevention() {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, ignore_dynamic_recursion_prevention: !settings.ignore_dynamic_recursion_prevention });
    }
  }

  const toggleExternalSource = source => {
    if (settings) {
      const newSources = settings.default_external_sources;
      if (newSources.indexOf(source) === -1) {
        newSources.push(source);
      } else {
        newSources.splice(newSources.indexOf(source), 1);
      }
      setModified(true);
      setSettings({ ...settings, default_external_sources: newSources });
    }
  };

  function toggleFiltering() {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, ignore_filtering: !settings.ignore_filtering });
    }
  }

  function toggleGenerateAlert() {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, generate_alert: !settings.generate_alert });
    }
  }

  function toggleCaching() {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, ignore_cache: !settings.ignore_cache });
    }
  }

  function toggleDeepScan() {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, deep_scan: !settings.deep_scan });
    }
  }

  function toggleExecutiveSummary() {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, executive_summary: !settings.executive_summary });
    }
  }

  function handleViewChange(event) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, submission_view: event.target.value });
    }
  }

  function handleEncodingChange(event) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, download_encoding: event.target.value });
    }
  }

  function handleEncodingPasswordChange(event) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, default_zip_password: event.target.value });
    }
  }

  function handleScoreChange(event) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, expand_min_score: event.target.value });
    }
  }

  function handlePreferredSubmissionProfileChange(event) {
    if (settings) {
      setModified(true);
      setSettings({ ...settings, preferred_submission_profile: event.target.value });
    }
  }

  function saveSettings() {
    if (settings) {
      apiCall({
        url: `/api/v4/user/settings/${currentUser.username}/`,
        method: 'POST',
        body: settings,
        onSuccess: () => {
          setModified(false);
          showSuccessMessage(t('success_save'));
        },
        onFailure: api_data => {
          if (api_data.api_status_code === 403) {
            showErrorMessage(api_data.api_error_message);
          }
        },
        onEnter: () => setButtonLoading(true),
        onExit: () => setButtonLoading(false)
      });
    }
  }

  function toggleDrawer(type: DrawerType) {
    if (settings) {
      setDrawerType(type);
      setDrawerOpen(true);
    }
  }

  useEffectOnce(() => {
    // Make interface editable
    setEditable(currentUser.is_admin || currentUser.roles.includes('self_manage'));

    // Load user on start
    apiCall<UserSettings>({
      url: `/api/v4/user/settings/${currentUser.username}/`,
      onSuccess: api_data => {
        setSettings(api_data.api_response);

        // Set submission profile preference
        setSubmissionProfileTab(api_data.api_response.preferred_submission_profile);
      }
    });
  });

  return (
    <PageCenter margin={4} width="100%">
      <React.Fragment key="right">
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div style={{ alignSelf: 'flex-end' }}>
            <IconButton onClick={() => setDrawerOpen(false)} size="large">
              <CloseIcon />
            </IconButton>
          </div>
          <div
            className={classes.drawer}
            style={{
              paddingTop: sp4,
              paddingBottom: sp6,
              paddingLeft: sp4,
              paddingRight: sp4,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {drawerType &&
              settings &&
              {
                ttl: (
                  <>
                    <Typography variant="h4">{t('submissions.ttl')}</Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      {t('submissions.ttl_desc')}
                    </Typography>
                    <TextField
                      autoFocus
                      type="number"
                      margin="dense"
                      size="small"
                      variant="outlined"
                      onChange={event => setTTL(event.target.value)}
                      value={settings.ttl}
                      inputProps={{
                        min: configuration.submission.max_dtl !== 0 ? 1 : 0,
                        max: configuration.submission.max_dtl !== 0 ? configuration.submission.max_dtl : 365
                      }}
                    />
                  </>
                ),
                view: (
                  <>
                    <Typography variant="h4">{t('interface.view')}</Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      {t('interface.view_desc')}
                    </Typography>
                    <div style={{ paddingTop: sp2, width: '100%' }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          id="view"
                          value={settings.submission_view}
                          onChange={handleViewChange}
                          variant="outlined"
                          style={{ width: '100%' }}
                        >
                          <MenuItem value="report">{t('interface.view_report')}</MenuItem>
                          <MenuItem value="details">{t('interface.view_details')}</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </>
                ),
                encoding: (
                  <>
                    <Typography variant="h4">{t('interface.encoding')}</Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      {t('interface.encoding_desc')}
                    </Typography>
                    <div style={{ paddingTop: sp2, width: '100%' }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          id="view"
                          value={settings.download_encoding}
                          onChange={handleEncodingChange}
                          variant="outlined"
                          style={{ width: '100%' }}
                        >
                          {!configuration.ui.allow_raw_downloads ? null : (
                            <MenuItem value="raw">{t('interface.encoding_raw')}</MenuItem>
                          )}
                          <MenuItem value="cart">{t('interface.encoding_cart')}</MenuItem>
                          {!configuration.ui.allow_zip_downloads ? null : (
                            <MenuItem value="zip">{t('interface.encoding_zip')}</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </div>
                    {settings.download_encoding !== 'zip' ? null : (
                      <>
                        <div style={{ paddingTop: sp2, width: '100%' }}>
                          <Typography variant="caption" color="textSecondary" gutterBottom>
                            {t('interface.encoding_password')}
                          </Typography>
                          <TextField
                            fullWidth
                            required={true}
                            onChange={handleEncodingPasswordChange}
                            variant="outlined"
                            value={settings.default_zip_password}
                          ></TextField>
                        </div>
                      </>
                    )}
                  </>
                ),
                preferred_submission_profile: (
                  <>
                    <Typography variant="h4">{t('submissions.submission_profile')}</Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      {t('submissions.submission_profile_desc')}
                    </Typography>
                    <Select
                      value={settings.preferred_submission_profile}
                      fullWidth
                      onChange={handlePreferredSubmissionProfileChange}
                    >
                      {Object.keys(settings.submission_profiles).map((profile, i) => (
                        <MenuItem key={i} value={profile}>
                          {profile}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                ),
                score: (
                  <>
                    <Typography variant="h4">{t('interface.score')}</Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      {t('interface.score_desc')}
                    </Typography>
                    <div style={{ paddingTop: sp2, width: '100%' }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          id="view"
                          value={settings.expand_min_score}
                          onChange={handleScoreChange}
                          variant="outlined"
                          style={{ width: '100%' }}
                        >
                          <MenuItem value="-1000000">{t('interface.score_-1000000')}</MenuItem>
                          <MenuItem value="0">{t('interface.score_0')}</MenuItem>
                          <MenuItem value="100">{t('interface.score_100')}</MenuItem>
                          <MenuItem value="500">{t('interface.score_500')}</MenuItem>
                          <MenuItem value="2000">{t('interface.score_2000')}</MenuItem>
                          <MenuItem value="100000000">{t('interface.score_100000000')}</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </>
                )
              }[drawerType]}
          </div>
        </Drawer>
      </React.Fragment>

      <TableContainer className={classes.group} component={Paper}>
        <Table aria-label={t('submissions')}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={isXS ? 2 : 3}>
                <Typography variant="h6" gutterBottom>
                  {t('submissions')}
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentUser.roles.includes('submission_customize') && (
              // Only users with the ability to fully customize submissions can set global defaults
              <>
                <ClickRow
                  enabled={editable && currentUser.roles.includes('submission_customize')}
                  onClick={toggleGenerateAlert}
                >
                  <TableCell colSpan={2} width="100%">
                    <Typography variant="body1">{t('submissions.generate_alert')}</Typography>
                    <Typography variant="caption">{t('submissions.generate_alert_desc')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={settings ? settings.generate_alert : false}
                      disabled={settings === null || !editable}
                      onChange={() => toggleGenerateAlert()}
                      color="secondary"
                      name="generate_alert"
                    />
                  </TableCell>
                </ClickRow>

                <ClickRow
                  enabled={editable && currentUser.roles.includes('submission_customize')}
                  onClick={toggleDynamicPrevention}
                >
                  <TableCell colSpan={2} width="100%">
                    <Typography variant="body1">{t('submissions.dynamic_recursion')}</Typography>
                    <Typography variant="caption">{t('submissions.dynamic_recursion_desc')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={settings ? !settings.ignore_dynamic_recursion_prevention : true}
                      disabled={settings === null || !editable}
                      onChange={() => toggleDynamicPrevention()}
                      color="secondary"
                      name="dynamic_resursion"
                    />
                  </TableCell>
                </ClickRow>
                <ClickRow
                  enabled={editable && currentUser.roles.includes('submission_customize')}
                  onClick={toggleFiltering}
                >
                  <TableCell colSpan={2} width="100%">
                    <Typography variant="body1">{t('submissions.filtering')}</Typography>
                    <Typography variant="caption">{t('submissions.filtering_desc')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={settings ? !settings.ignore_filtering : true}
                      disabled={settings === null || !editable}
                      onChange={() => toggleFiltering()}
                      color="secondary"
                      name="filtering"
                    />
                  </TableCell>
                </ClickRow>
                <ClickRow
                  enabled={editable && currentUser.roles.includes('submission_customize')}
                  onClick={toggleCaching}
                >
                  <TableCell colSpan={2} width="100%">
                    <Typography variant="body1">{t('submissions.result_caching')}</Typography>
                    <Typography variant="caption">{t('submissions.result_caching_desc')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={settings ? !settings.ignore_cache : true}
                      disabled={settings === null || !editable}
                      onChange={() => toggleCaching()}
                      color="secondary"
                      name="result_caching"
                    />
                  </TableCell>
                </ClickRow>
                <ClickRow
                  enabled={editable && currentUser.roles.includes('submission_customize')}
                  onClick={toggleDeepScan}
                >
                  <TableCell colSpan={2} width="100%">
                    <Typography variant="body1">{t('submissions.deep_scan')}</Typography>
                    <Typography variant="caption">{t('submissions.deep_scan_desc')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={settings ? settings.deep_scan : true}
                      disabled={settings === null || !editable}
                      onChange={() => toggleDeepScan()}
                      color="secondary"
                      name="deep_scan"
                    />
                  </TableCell>
                </ClickRow>
              </>
            )}
            {settings?.submission_profiles && (
              <ClickRow enabled={editable} chevron onClick={event => toggleDrawer('preferred_submission_profile')}>
                {isXS ? null : (
                  <TableCell>
                    <Typography variant="body1">{t('submissions.submission_profile')}</Typography>
                    <Typography variant="caption">{t('submissions.submission_profile_desc')}</Typography>
                  </TableCell>
                )}
                <TableCell colSpan={isXS ? 2 : 1}>
                  {!isXS ? null : (
                    <>
                      <Typography variant="body1">{t('submissions.submission_profile')}</Typography>
                      <Typography variant="caption" gutterBottom>
                        {t('submissions.submission_profile_desc')}
                      </Typography>
                    </>
                  )}
                  {settings ? (
                    <Typography variant="subtitle2" color="primary" textAlign={'right'}>
                      {settings.preferred_submission_profile}
                    </Typography>
                  ) : (
                    <Skeleton />
                  )}
                </TableCell>
              </ClickRow>
            )}
            {configuration.ui.ai.enabled && (
              <ClickRow enabled={editable} onClick={toggleExecutiveSummary}>
                <TableCell colSpan={2} width="100%">
                  <Typography variant="body1">{t('submissions.executive_summary')}</Typography>
                  <Typography variant="caption">{t('submissions.executive_summary_desc')}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Switch
                    checked={settings ? settings.executive_summary : true}
                    disabled={settings === null || !editable}
                    onChange={() => toggleExecutiveSummary()}
                    color="secondary"
                    name="executive_summary"
                  />
                </TableCell>
              </ClickRow>
            )}
            {currentUser.roles.includes('submission_customize') && (
              // Only users with the ability to fully customize submissions can set global defaults
              <ClickRow enabled={editable} chevron onClick={event => toggleDrawer('ttl')}>
                {isXS ? null : (
                  <TableCell>
                    <Typography variant="body1">{t('submissions.ttl')}</Typography>
                    <Typography variant="caption">{t('submissions.ttl_desc')}</Typography>
                  </TableCell>
                )}
                <TableCell colSpan={isXS ? 2 : 1}>
                  {!isXS ? null : (
                    <>
                      <Typography variant="body1">{t('submissions.ttl')}</Typography>
                      <Typography variant="caption" gutterBottom>
                        {t('submissions.ttl_desc')}
                      </Typography>
                    </>
                  )}
                  {settings ? (
                    <Typography variant="subtitle2" color="primary" textAlign={'right'}>
                      {settings.ttl === 0
                        ? t('submissions.ttl_forever')
                        : `${settings.ttl} ${t('submissions.ttl_days')}`}
                    </Typography>
                  ) : (
                    <Skeleton />
                  )}
                </TableCell>
              </ClickRow>
            )}
            {c12nDef.enforce && (
              <TableRow>
                {isXS ? null : (
                  <TableCell>
                    <Typography variant="body1">{t('submissions.classification')}</Typography>
                    <Typography variant="caption">{t('submissions.classification_desc')}</Typography>
                  </TableCell>
                )}
                <TableCell colSpan={isXS ? 3 : 2}>
                  {!isXS ? null : (
                    <>
                      <Typography variant="body1">{t('submissions.classification')}</Typography>
                      <Typography variant="caption" gutterBottom>
                        {t('submissions.classification_desc')}
                      </Typography>
                    </>
                  )}
                  <Classification
                    type={editable ? 'picker' : 'pill'}
                    size="small"
                    c12n={settings ? settings.classification : null}
                    setClassification={setClassification}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer className={classes.group} component={Paper}>
        <Table aria-label={t('interface')}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={3}>
                <Typography variant="h6" gutterBottom>
                  {t('interface')}
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <ClickRow enabled={editable} chevron onClick={event => toggleDrawer('view')}>
              {isXS ? null : (
                <TableCell>
                  <Typography variant="body1">{t('interface.view')}</Typography>
                  <Typography variant="caption">{t('interface.view_desc')}</Typography>
                </TableCell>
              )}
              <TableCell colSpan={isXS ? 2 : 1}>
                {!isXS ? null : (
                  <>
                    <Typography variant="body1">{t('interface.view')}</Typography>
                    <Typography variant="caption" gutterBottom>
                      {t('interface.view_desc')}
                    </Typography>
                  </>
                )}
                {settings ? (
                  <Typography variant="subtitle2" color="primary">
                    {t(`interface.view_${settings.submission_view}`)}
                  </Typography>
                ) : (
                  <Skeleton />
                )}
              </TableCell>
            </ClickRow>
            <ClickRow enabled={editable} chevron onClick={event => toggleDrawer('encoding')}>
              {isXS ? null : (
                <TableCell>
                  <Typography variant="body1">{t('interface.encoding')}</Typography>
                  <Typography variant="caption">{t('interface.encoding_desc')}</Typography>
                </TableCell>
              )}
              <TableCell colSpan={isXS ? 2 : 1}>
                {!isXS ? null : (
                  <>
                    <Typography variant="body1">{t('interface.encoding')}</Typography>
                    <Typography variant="caption" gutterBottom>
                      {t('interface.encoding_desc')}
                    </Typography>
                  </>
                )}
                {settings ? (
                  <>
                    <Typography variant="subtitle2" color="primary">
                      {t(`interface.encoding_${settings.download_encoding}`)}
                    </Typography>
                    {settings.download_encoding !== 'zip' ? null : (
                      <>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle', paddingRight: '3px' }}>
                          <LockOutlinedIcon fontSize="small" />
                        </div>
                        <Typography variant="caption">{settings.default_zip_password}</Typography>
                      </>
                    )}
                  </>
                ) : (
                  <Skeleton />
                )}
              </TableCell>
            </ClickRow>
            <ClickRow enabled={editable} chevron onClick={event => toggleDrawer('score')}>
              {isXS ? null : (
                <TableCell>
                  <Typography variant="body1">{t('interface.score')}</Typography>
                  <Typography variant="caption">{t('interface.score_desc')}</Typography>
                </TableCell>
              )}
              <TableCell colSpan={isXS ? 2 : 1}>
                {!isXS ? null : (
                  <>
                    <Typography variant="body1">{t('interface.score')}</Typography>
                    <Typography variant="caption" gutterBottom>
                      {t('interface.score_desc')}
                    </Typography>
                  </>
                )}
                {settings ? (
                  <Typography variant="subtitle2" color="primary">
                    {t(`interface.score_${settings.expand_min_score}`)}
                  </Typography>
                ) : (
                  <Skeleton />
                )}
              </TableCell>
            </ClickRow>
          </TableBody>
        </Table>
      </TableContainer>
      {fileSources && fileSources.length > 0 && (
        <Paper className={classes.group}>
          <ExternalSources disabled={!editable} settings={settings} onChange={toggleExternalSource} />
        </Paper>
      )}

      {settings && settings.submission_profiles && (
        // If we have submission profiles, then allow configuration of parameters per profile
        <Paper className={classes.group}>
          <div style={{ padding: sp2, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom>
              {t('submission_profile')}
            </Typography>
            <TabContext value={submissionProfileTab}>
              <TabList
                centered
                indicatorColor="primary"
                textColor="primary"
                scrollButtons
                onChange={(_, value) => setSubmissionProfileTab(value)}
              >
                {Object.keys(settings.submission_profiles)
                  .filter(name => settings.submission_profiles[name].service_spec.length)
                  .map((profile_name, i) => (
                    <Tab key={i} label={profile_name} value={profile_name} />
                  ))}
              </TabList>
              {Object.entries(settings.submission_profiles)
                .filter(([_, config]) => config.service_spec)
                .map(([profile_name, profile_config], i) => (
                  <TabPanel key={i} value={profile_name}>
                    <ServiceSpec service_spec={profile_config.service_spec} setParam={setSubmissionProfileParam} />
                  </TabPanel>
                ))}
            </TabContext>
          </div>
        </Paper>
      )}

      {currentUser.roles.includes('submission_customize') && (
        // Only users with the ability to fully customize submissions can set global defaults
        <>
          <Paper className={classes.group}>
            <div style={{ padding: sp2, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                {t('service')}
              </Typography>
              <ServiceTree
                disabled={!editable}
                settings={settings}
                setSettings={setSettings}
                setModified={setModified}
                compressed
                submissionProfile={null}
              />
            </div>
          </Paper>

          <Paper className={classes.group}>
            <div style={{ padding: sp2, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                {t('service_spec')}
              </Typography>
              {settings ? (
                <ServiceSpec
                  disabled={!editable}
                  service_spec={settings.service_spec}
                  setParam={setParam}
                  compressed
                  hasResetButton
                />
              ) : (
                <div>
                  <Skel />
                  <Skel />
                  <Skel />
                  <Skel />
                </div>
              )}
            </div>
          </Paper>
        </>
      )}

      <RouterPrompt when={modified} />
      {settings && modified && (
        <div
          style={{
            paddingTop: sp1,
            paddingBottom: sp1,
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: theme.zIndex.drawer - 1,
            backgroundColor: theme.palette.background.default,
            boxShadow: theme.shadows[4]
          }}
        >
          <Button variant="contained" color="primary" disabled={buttonLoading || !modified} onClick={saveSettings}>
            {t('save')}
            {buttonLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
          </Button>
        </div>
      )}
    </PageCenter>
  );
}

export default memo(Settings);
