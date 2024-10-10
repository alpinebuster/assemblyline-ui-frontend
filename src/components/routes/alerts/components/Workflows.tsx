import AddIcon from '@mui/icons-material/Add';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Alert,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import type { AutocompleteChangeReason } from '@mui/material/Autocomplete';
import Autocomplete from '@mui/material/Autocomplete';
import makeStyles from '@mui/styles/makeStyles';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { AlertItem } from 'components/models/base/alert';
import { LABELS, PRIORITIES, STATUSES, type Label, type Priority, type Status } from 'components/models/base/workflow';
import type { CustomUser } from 'components/models/ui/user';
import type { AlertSearchParams } from 'components/routes/alerts';
import { useSearchParams } from 'components/routes/alerts/contexts/SearchParamsContext';
import type { SearchResult } from 'components/routes/alerts/utils/SearchParser';
import CustomChip from 'components/visual/CustomChip';
import type { SyntheticEvent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiNetworkChart } from 'react-icons/bi';
import AlertFiltersSelected from './FiltersSelected';

const useStyles = makeStyles(theme => ({
  drawerInner: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    width: '600px',
    [theme.breakpoints.only('xs')]: {
      width: '100vw'
    }
  },
  selectMenu: {
    backgroundColor: theme.palette.background.default
  }
}));

type WorkflowBody = {
  priority: Priority;
  status: Status;
  labels: Label[];
  removed_labels: Label[];
};

type AlertWorkflowDrawerProps = {
  alerts: AlertItem[];
  search: SearchResult<AlertSearchParams>;
  open: boolean;
  initialBody?: WorkflowBody;
  onClose?: () => void;
};

export const AlertWorkflowDrawer = React.memo(
  ({
    alerts = [],
    search = null,
    open = false,
    initialBody = { priority: null, status: null, labels: [], removed_labels: [] },
    onClose = () => null
  }: AlertWorkflowDrawerProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const classes = useStyles();
    const { apiCall } = useMyAPI();
    const { user: currentUser } = useAppUser<CustomUser>();
    const { showErrorMessage, showSuccessMessage } = useMySnackbar();

    const [body, setBody] = useState<WorkflowBody>(initialBody);
    const [waiting, setWaiting] = useState<boolean>(false);
    const [labelFilters, setLabelFilters] = useState<string[]>([]);

    const prevQuery = useRef<string>(null);

    const possibleLabels = useMemo<string[]>(() => {
      const values = [...LABELS, ...labelFilters].filter((v, i, a) => a.indexOf(v) === i);
      values.sort((a, b) => a.localeCompare(b));
      return values;
    }, [labelFilters]);

    const isSingleAlert = useMemo<boolean>(
      () => search && search.has('q') && !!search.get('q').startsWith('alert_id'),
      [search]
    );

    const filteredSearch = useMemo<SearchResult<AlertSearchParams>>(
      () =>
        !search ? null : search.filter(k => ['q', 'tc', 'tc_start', ...(isSingleAlert ? [] : ['fq'])].includes(k)),
      [isSingleAlert, search]
    );

    const hasParams = useMemo<boolean>(
      () => filteredSearch && (filteredSearch.has('q') || filteredSearch.has('fq') || filteredSearch.has('tc')),
      [filteredSearch]
    );

    const validBody = useMemo<boolean>(
      () =>
        PRIORITIES.includes(body.priority) ||
        STATUSES.includes(body.status) ||
        body.labels.length > 0 ||
        body.removed_labels.length > 0,
      [body]
    );

    const handleWorkflowSubmit = useCallback(
      (_query: URLSearchParams, _body: WorkflowBody, _alerts: AlertItem[], _isSingleAlert: boolean) => {
        if (!currentUser.roles.includes('alert_manage')) return;
        apiCall({
          url: `/api/v4/alert/all/batch/?${_query.toString()}`,
          method: 'POST',
          body: _body,
          onSuccess: ({ api_response }) => {
            if (!api_response.success) {
              showErrorMessage(t('workflow.error'));
              return;
            } else {
              const detail: Partial<AlertItem>[] = _alerts.map(alert => ({
                ...alert,
                ...(!STATUSES.includes(_body.status) ? null : { status: _body.status }),
                ...(!PRIORITIES.includes(_body.priority) ? null : { priority: _body.priority }),
                label: [...alert.label.filter((label: Label) => !_body.removed_labels.includes(label)), ..._body.labels]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .sort()
              }));
              window.dispatchEvent(new CustomEvent<Partial<AlertItem>[]>('alertUpdate', { detail }));
              !_isSingleAlert && setTimeout(() => window.dispatchEvent(new CustomEvent('alertRefresh', null)), 1500);
              showSuccessMessage(t('workflow.success'));
            }
          },
          onFailure: ({ api_error_message }) => showErrorMessage(api_error_message),
          onEnter: () => setWaiting(true),
          onExit: () => {
            setWaiting(false);
            onClose();
            setBody(initialBody);
          }
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [currentUser.roles, initialBody, onClose, showErrorMessage, showSuccessMessage, t]
    );

    useEffect(() => {
      if (
        !open ||
        !filteredSearch ||
        prevQuery.current === filteredSearch?.toString() ||
        !currentUser.roles.includes('alert_view')
      )
        return;
      prevQuery.current = filteredSearch?.toString();

      apiCall({
        url: `/api/v4/alert/labels/?${filteredSearch.toString()}`,
        onSuccess: ({ api_response }) => setLabelFilters(Object.keys(api_response))
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser.roles, open]);

    return (
      <>
        <Drawer
          open={open}
          anchor="right"
          onClose={() => {
            onClose();
            setBody(initialBody);
          }}
        >
          <div style={{ padding: theme.spacing(1) }}>
            <IconButton
              size="large"
              onClick={() => {
                onClose();
                setBody(initialBody);
              }}
            >
              <CloseOutlinedIcon />
            </IconButton>
          </div>
          <div className={classes.drawerInner}>
            <div style={{ margin: theme.spacing(1), marginBottom: theme.spacing(2) }}>
              <Typography variant="h4">{t('workflow.title')}</Typography>
            </div>
            <div style={{ margin: theme.spacing(1) }}>
              <Alert severity={isSingleAlert ? 'info' : 'warning'}>
                {isSingleAlert
                  ? t('workflow.impact.low')
                  : hasParams
                  ? t('workflow.impact.high')
                  : t('workflow.impact.all')}
              </Alert>
            </div>

            {hasParams && (
              <div style={{ margin: theme.spacing(1) }}>
                <div
                  style={{
                    wordBreak: 'break-word',
                    marginTop: theme.spacing(1),
                    padding: theme.spacing(2),
                    color: theme.palette.primary.light,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[200],
                    borderRadius: theme.spacing(0.5)
                  }}
                >
                  <AlertFiltersSelected
                    value={filteredSearch.toObject()}
                    visible={isSingleAlert ? ['fq', 'group_by', 'q'] : ['fq', 'group_by', 'q', 'timerange']}
                    disabled
                  />
                </div>
              </div>
            )}

            <div style={{ margin: theme.spacing(1), marginTop: theme.spacing(2) }}>
              <div style={{ marginBottom: theme.spacing(2) }}>
                <Autocomplete
                  classes={{ listbox: classes.selectMenu }}
                  fullWidth
                  multiple={false}
                  options={STATUSES}
                  value={body.status}
                  onChange={(_event: SyntheticEvent<Element, Event>, value: Status) =>
                    setBody(b => ({ ...b, status: value }))
                  }
                  renderInput={props => <TextField {...props} label={t('status')} variant="outlined" />}
                />
              </div>
              <div style={{ marginBottom: theme.spacing(2) }}>
                <Autocomplete
                  classes={{ listbox: classes.selectMenu }}
                  fullWidth
                  multiple={false}
                  options={PRIORITIES}
                  value={body.priority}
                  onChange={(_event: SyntheticEvent<Element, Event>, value: Priority) =>
                    setBody(b => ({ ...b, priority: value }))
                  }
                  renderInput={props => <TextField {...props} label={t('priority')} variant="outlined" />}
                />
              </div>
              <div style={{ marginBottom: theme.spacing(2) }}>
                <Autocomplete
                  classes={{ listbox: classes.selectMenu }}
                  fullWidth
                  multiple
                  freeSolo
                  disableCloseOnSelect
                  filterSelectedOptions
                  isOptionEqualToValue={(option, value) => option.toUpperCase() === value.toUpperCase()}
                  options={possibleLabels}
                  value={[...body.labels, ...body.removed_labels].sort()}
                  onChange={(_event, values: Label[], reason: AutocompleteChangeReason) => {
                    if (reason === 'clear') setBody(b => ({ ...b, labels: [], removed_labels: [] }));
                    else
                      setBody(b => ({
                        ...b,
                        labels: values.filter(v => !b.removed_labels.includes(v)).map(v => v.toUpperCase()) as Label[]
                      }));
                  }}
                  renderInput={props => <TextField {...props} label={t('labels')} variant="outlined" />}
                  renderOption={(props, option, state) => {
                    const matches = match(option, state.inputValue, { insideWords: true });
                    const parts = parse(option, matches);
                    return (
                      <li {...props} key={state.index}>
                        {parts.map((part, index) => (
                          <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                            {part.text}
                          </span>
                        ))}
                      </li>
                    );
                  }}
                  renderTags={(values, getTagProps) =>
                    values.map((value: Label, index) =>
                      body.labels.includes(value) ? (
                        <CustomChip
                          {...getTagProps({ index })}
                          key={index}
                          icon={<AddIcon color="success" />}
                          label={value}
                          color="success"
                          variant="outlined"
                          onClick={() =>
                            setBody(b => ({
                              ...b,
                              labels: b.labels.filter(label => label !== value),
                              removed_labels: [...b.removed_labels, value]
                            }))
                          }
                          onDelete={() => setBody(b => ({ ...b, labels: b.labels.filter(label => label !== value) }))}
                        />
                      ) : (
                        <CustomChip
                          {...getTagProps({ index })}
                          key={index}
                          icon={<RemoveIcon color="error" />}
                          label={value}
                          color="error"
                          variant="outlined"
                          onClick={() =>
                            setBody(b => ({
                              ...b,
                              removed_labels: b.removed_labels.filter(label => label !== value),
                              labels: [...b.labels, value]
                            }))
                          }
                          onDelete={() =>
                            setBody(b => ({ ...b, removed_labels: b.removed_labels.filter(label => label !== value) }))
                          }
                        />
                      )
                    )
                  }
                />
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: theme.spacing(1) }}>
              <Tooltip title={t('workflow.apply')}>
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleWorkflowSubmit(filteredSearch.toParams(), body, alerts, isSingleAlert)}
                    startIcon={waiting ? <CircularProgress size={20} /> : null}
                    disabled={waiting || !validBody}
                  >
                    {t('apply')}
                  </Button>
                </span>
              </Tooltip>
            </div>
          </div>
        </Drawer>
      </>
    );
  }
);

type Props = {
  alerts: AlertItem[];
};

const WrappedAlertWorkflows = ({ alerts = [] }: Props) => {
  const { t } = useTranslation('alerts');
  const theme = useTheme();
  const { user: currentUser } = useAppUser<CustomUser>();
  const { search } = useSearchParams<AlertSearchParams>();

  const [open, setOpen] = useState<boolean>(false);

  const isMDUp = useMediaQuery(theme.breakpoints.up('md'));

  if (!currentUser.roles.includes('alert_manage')) return null;
  else
    return (
      <>
        <Tooltip title={t('workflows')}>
          <span>
            <IconButton size="large" onClick={() => setOpen(true)} style={{ marginRight: 0 }}>
              <BiNetworkChart
                style={{
                  height: isMDUp ? theme.spacing(2.5) : theme.spacing(2),
                  width: isMDUp ? theme.spacing(2.5) : theme.spacing(2),
                  margin: theme.spacing(0.25)
                }}
              />
              <PlayArrowIcon style={{ position: 'absolute', bottom: '10px', right: '6px', fontSize: 'small' }} />
            </IconButton>
          </span>
        </Tooltip>

        <AlertWorkflowDrawer alerts={alerts} search={search} open={open} onClose={() => setOpen(false)} />
      </>
    );
};

export const AlertWorkflows = React.memo(WrappedAlertWorkflows);
export default AlertWorkflows;
