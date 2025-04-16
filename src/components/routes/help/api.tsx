import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Card, Collapse, Grid, MenuItem, Select, Typography, useMediaQuery, useTheme } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Skeleton from '@mui/material/Skeleton';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import PageFullWidth from 'commons/components/pages/PageFullWidth';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import CustomChip from 'components/visual/CustomChip';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const apiHeight = '48px';
const useStyles = makeStyles(theme => ({
  api: {
    minHeight: apiHeight,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.selected
    }
  },
  blueprint: {
    minHeight: apiHeight,
    alignItems: 'center',
    borderColor: theme.palette.action.disabledBackground,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.selected
    }
  },
  blueprintSkel: {
    minHeight: apiHeight,
    alignItems: 'center',
    borderColor: theme.palette.action.disabledBackground
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: theme.spacing(2),
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  }
}));

export default function ApiDoc() {
  const { apiCall } = useMyAPI();
  const [apiList, setApiList] = useState(null);
  const [apiSelected, setApiSelected] = useState(null);
  const [apiDefinition, setApiDefinition] = useState(null);
  const { configuration } = useALContext();
  const classes = useStyles();
  const [expandMap, setExpandMap] = useState({});
  const theme = useTheme();
  const { t } = useTranslation(['helpAPI']);
  const sp1 = theme.spacing(1);
  const sp2 = theme.spacing(2);

  const downSM = useMediaQuery(theme.breakpoints.down('md'));
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const isDark = theme.palette.mode === 'dark';
  const methodColor = {
    DELETE: 'error',
    GET: 'info',
    POST: 'success',
    PUT: 'warning'
  };
  const userColor = {
    signature_import: 'success',
    signature_manage: 'info',
    signature_view: 'default',
    signature_download: 'warning',
    administration: 'error',
    alert_view: 'default',
    alert_manage: 'info',
    archive_view: 'default',
    archive_download: 'warning',
    archive_trigger: 'warning',
    archive_manage: 'info',
    self_manage: 'info',
    safelist_view: 'default',
    safelist_manage: 'info',
    badlist_view: 'default',
    badlist_manage: 'info',
    workflow_view: 'default',
    workflow_manage: 'info',
    apikey_access: 'default',
    obo_access: 'default',
    bundle_download: 'warning',
    submission_create: 'success',
    submission_view: 'default',
    submission_delete: 'error',
    submission_manage: 'info',
    file_detail: 'default',
    file_download: 'warning',
    replay_trigger: 'warning',
    replay_system: 'info'
  };

  function toggleBlueprintExpand(bp) {
    const newValue = {};
    newValue[bp] = !expandMap[bp];
    setExpandMap({ ...expandMap, ...newValue });
  }

  function blueprintAPIs(bp) {
    const out = [];
    if (apiDefinition) {
      for (const item of apiDefinition.apis) {
        if (bp === 'documentation') {
          if (item.path === `/api/${apiSelected}/`) {
            out.push(item);
          }
        } else if (item.path.indexOf(`/api/${apiSelected}/${bp}/`) === 0) {
          out.push(item);
        }
      }
    }
    return out.sort(compare);
  }

  function compare(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  useEffect(() => {
    if (apiList) {
      apiCall({
        url: `/api/${apiSelected}/`,
        onSuccess: api_data => {
          setApiDefinition(api_data.api_response);
        }
      });
    } else {
      apiCall({
        url: '/api/',
        onSuccess: api_data => {
          setApiList(api_data.api_response);
          setApiSelected(api_data.api_response[0]);
        }
      });
    }
    // eslint-disable-next-line
  }, [apiSelected]);

  return (
    <PageFullWidth margin={4}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ marginBottom: theme.spacing(4) }}>
          <Grid container>
            <Grid size={{ xs: 12, sm: 'grow' }}>
              <Typography variant="h4">{t('title')}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 'grow' }} style={{ textAlign: 'end' }}>
              {apiList && apiSelected ? (
                <FormControl size="small">
                  <Select
                    id="api"
                    value={apiSelected}
                    onChange={event => setApiSelected(event.target.value)}
                    variant="outlined"
                  >
                    {apiList.map((version, index) => (
                      <MenuItem key={index} value={version}>
                        {version.replace('v', t('version')) + t('version_end')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Skeleton variant="rectangular" style={{ display: 'inline-block', height: '2rem', width: '14rem' }} />
              )}
            </Grid>
          </Grid>
        </div>
        {apiDefinition ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Object.keys(apiDefinition.blueprints).map((bp, i) => (
              <div key={i}>
                <Box
                  display="flex"
                  flexDirection="row"
                  flexWrap="wrap"
                  className={classes.blueprint}
                  borderBottom={1}
                  px={1}
                  onClick={() => toggleBlueprintExpand(bp)}
                >
                  <Typography variant="body2" color="textSecondary" style={{ fontWeight: 800, lineHeight: 2 }}>
                    {`/api/${apiSelected}/`}&nbsp;
                  </Typography>
                  <div style={{ flexGrow: 1 }}>
                    <Typography variant="h6" style={{ fontWeight: 800, lineHeight: 2 }} color="secondary">
                      {bp}
                    </Typography>
                  </div>
                  <div style={{ display: 'inline-flex', width: downSM ? '100%' : null, justifyContent: 'flex-end' }}>
                    <Typography variant="body2" color="textSecondary" align="right" style={{ lineHeight: 2 }}>
                      {apiDefinition.blueprints[bp]}
                    </Typography>
                    <ExpandMoreIcon
                      className={clsx(classes.expand, {
                        [classes.expandOpen]: expandMap[bp]
                      })}
                    />
                  </div>
                </Box>
                <Collapse in={expandMap[bp]} timeout="auto" unmountOnExit>
                  <div
                    style={{
                      backgroundColor: isDark ? theme.palette.grey[900] : theme.palette.grey[100]
                    }}
                  >
                    {blueprintAPIs(bp).map((api, idx) => (
                      <div key={idx}>
                        <Box
                          className={classes.api}
                          px={1}
                          display="flex"
                          flexDirection={xs ? 'column' : 'row'}
                          flexWrap="wrap"
                          alignItems={xs ? 'flex-start' : 'center'}
                          onClick={() => toggleBlueprintExpand(api.name)}
                        >
                          <div>
                            {api.methods.map((method, midx) => (
                              <CustomChip
                                color={methodColor[method]}
                                type="rounded"
                                size="small"
                                key={midx}
                                label={method}
                              />
                            ))}
                          </div>
                          <div style={{ flexGrow: 1 }}>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              style={{ wordBreak: 'break-word', lineHeight: 2 }}
                            >
                              {api.path}
                            </Typography>
                          </div>
                          <div
                            style={{
                              display: 'inline-flex',
                              width: downSM ? '100%' : null,
                              justifyContent: 'flex-end'
                            }}
                          >
                            <Typography align="right" variant="caption" style={{ lineHeight: 2 }}>
                              {api.name}
                            </Typography>

                            <ExpandMoreIcon
                              className={clsx(classes.expand, {
                                [classes.expandOpen]: expandMap[api.name]
                              })}
                            />
                          </div>
                        </Box>
                        <Collapse in={expandMap[api.name]} timeout="auto" unmountOnExit>
                          <div
                            style={{
                              border: 1,
                              borderTop: 0,
                              borderBottom: 0,
                              padding: sp1,
                              borderColor: isDark ? theme.palette.grey[900] : theme.palette.grey[100],
                              backgroundColor: theme.palette.background.default
                            }}
                          >
                            <Grid container alignItems="center">
                              <>
                                <Grid size={{ xs: 8, sm: 4, md: 3, lg: 2 }}>
                                  <div style={{ fontWeight: 500 }}>{t('complete')}:</div>
                                </Grid>
                                <Grid size={{ xs: 4, sm: 8, md: 9, lg: 4 }}>
                                  {api.complete ? (
                                    <CheckOutlinedIcon htmlColor={theme.palette.success.main} />
                                  ) : (
                                    <ClearOutlinedIcon htmlColor={theme.palette.error.main} />
                                  )}
                                </Grid>
                              </>
                              <>
                                <Grid size={{ xs: 8, sm: 4, md: 3, lg: 2 }}>
                                  <div style={{ fontWeight: 500 }}>{t('protected')}:</div>
                                </Grid>
                                <Grid size={{ xs: 4, sm: 8, md: 9, lg: 4 }}>
                                  {api.protected ? (
                                    <CheckOutlinedIcon htmlColor={theme.palette.success.main} />
                                  ) : (
                                    <ClearOutlinedIcon htmlColor={theme.palette.error.main} />
                                  )}
                                </Grid>
                              </>
                              {configuration.ui.enforce_quota && (
                                <>
                                  <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
                                    <div style={{ fontWeight: 500 }}>{t('quota')}:</div>
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 8, md: 9, lg: 4 }}>
                                    {api.count_towards_quota ? (
                                      <CheckOutlinedIcon htmlColor={theme.palette.success.main} />
                                    ) : (
                                      <ClearOutlinedIcon htmlColor={theme.palette.error.main} />
                                    )}
                                  </Grid>
                                </>
                              )}
                              <>
                                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
                                  <div style={{ fontWeight: 500 }}>{t('require_role')}:</div>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8, md: 9, lg: 4 }}>
                                  {api.require_role.map((utype, uidx) => (
                                    <CustomChip
                                      key={uidx}
                                      color={userColor[utype]}
                                      type="rounded"
                                      size="tiny"
                                      label={t(`role.${utype}`)}
                                    />
                                  ))}
                                </Grid>
                              </>
                              <>
                                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
                                  <div style={{ fontWeight: 500 }}>{t('methods')}:</div>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8, md: 9, lg: 4 }}>
                                  {api.methods.map((met, metid) => (
                                    <CustomChip
                                      key={metid}
                                      color={methodColor[met]}
                                      type="rounded"
                                      size="tiny"
                                      label={t(met)}
                                    />
                                  ))}
                                </Grid>
                              </>
                              <>
                                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
                                  <div style={{ fontWeight: 500 }}>{t('path')}:</div>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8, md: 9, lg: 4 }}>
                                  <div style={{ lineHeight: 2, fontFamily: 'Monospace', wordBreak: 'break-word' }}>
                                    {api.path}
                                  </div>
                                </Grid>
                              </>
                              <>
                                <Grid size={{ xs: 12 }}>
                                  <div style={{ fontWeight: 500, lineHeight: 2 }}>{t('description')}:</div>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Card variant="outlined" style={{ overflowX: 'auto' }}>
                                    <pre style={{ paddingLeft: sp2, paddingRight: sp2 }}>{api.description}</pre>
                                  </Card>
                                </Grid>
                              </>
                            </Grid>
                          </div>
                        </Collapse>
                      </div>
                    ))}
                  </div>
                </Collapse>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...Array(21)].map((_, i) => (
              <div
                key={i}
                style={{
                  paddingLeft: sp1,
                  paddingRight: sp1,
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  borderBottom: 1
                }}
                className={classes.blueprintSkel}
              >
                <Typography variant="body2" style={{ paddingRight: '8px' }}>
                  <Skeleton width="2rem" />
                </Typography>
                <div style={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    <Skeleton width="12rem" />
                  </Typography>
                </div>
                <div style={{ display: 'inline-flex', width: downSM ? '100%' : null, justifyContent: 'flex-end' }}>
                  <Typography variant="body2" style={{ paddingRight: '16px', lineHeight: 2 }}>
                    <Skeleton width="14rem" />
                  </Typography>
                  <Skeleton width="1rem" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFullWidth>
  );
}
