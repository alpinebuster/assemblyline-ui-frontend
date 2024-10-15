import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import type { CloseReason, OpenReason } from '@mui/material';
import {
  Badge,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { AlertItem } from 'components/models/base/alert';
import type { CustomUser } from 'components/models/ui/user';
import type { AlertSearchParams } from 'components/routes/alerts';
import { useSearchParams } from 'components/routes/alerts/contexts/SearchParamsContext';
import type { SearchResult } from 'components/routes/alerts/utils/SearchParser';
import ConfirmationDialog from 'components/visual/ConfirmationDialog';
import { getValueFromPath } from 'helpers/utils';
import type { To } from 'history';
import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiNetworkChart } from 'react-icons/bi';
import { Link, useLocation } from 'react-router-dom';
import { AlertEventsTable } from './Components';
import AlertFiltersSelected from './FiltersSelected';
import { AlertWorkflowDrawer } from './Workflows';

const useStyles = makeStyles(theme => ({
  verticalSpeedDialFab: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[0],
    '&.MuiFab-root': {
      backgroundColor: theme.palette.background.paper
    },
    '&.MuiFab-root:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.MuiFab-root:active': {
      boxShadow: theme.shadows[0]
    },
    color: theme.palette.text.secondary
  },
  permanentSpeedDialFab: {
    display: 'none',
    color: theme.palette.text.secondary
  },
  permanentSpeedDial: {
    marginRight: '-6px'
  },
  actionsClosed: {
    width: 0
  },
  disabled: {
    '&.Mui-disabled': {
      backgroundColor: 'initial'
    }
  },
  buttonProgress: {
    color: theme.palette.primary.main,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  },
  preview: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: theme.spacing(1),
    margin: 0,
    padding: theme.spacing(1.5),
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[200]
  }
}));

type AlertActionButtonProps = {
  authorized?: boolean;
  color?: CSSProperties['color'];
  disabled?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  open?: boolean;
  permanent?: boolean;
  showSkeleton?: boolean;
  speedDial?: boolean;
  to?: To;
  tooltipTitle?: string;
  vertical?: boolean;
  onClick?: React.MouseEventHandler;
};

const AlertActionButton: React.FC<AlertActionButtonProps> = React.memo(
  ({
    authorized = true,
    color = null,
    disabled = false,
    icon = null,
    loading = false,
    open = false,
    permanent = false,
    showSkeleton = false,
    speedDial = false,
    to = null,
    tooltipTitle = '',
    vertical = false,
    onClick = () => null
  }: AlertActionButtonProps) => {
    const theme = useTheme();
    const classes = useStyles();

    const Wrapper = useCallback<React.FC<{ children: React.ReactNode; href: To }>>(
      ({ children, href }) => (href ? <Link to={href}>{children}</Link> : <div>{children}</div>),
      []
    );

    if (showSkeleton)
      return <Skeleton variant="circular" height="2.5rem" width="2.5rem" style={{ margin: theme.spacing(0.5) }} />;
    else if (!authorized) return null;
    else if (speedDial)
      return (
        <Wrapper href={to}>
          <SpeedDialAction
            icon={
              <>
                {icon}
                {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
              </>
            }
            open={open}
            tooltipTitle={tooltipTitle}
            tooltipPlacement={vertical ? 'left' : 'bottom'}
            FabProps={{
              className: clsx(permanent && classes.disabled),
              disabled: disabled || loading,
              size: permanent ? 'medium' : 'small',
              style: {
                boxShadow: permanent ? theme.shadows[0] : null,
                margin: permanent ? '8px 2px 8px 2px' : null,
                ...(loading ? { color: theme.palette.action.disabled } : color && { color: color })
              }
            }}
            onClick={disabled || loading ? null : onClick}
          />
        </Wrapper>
      );
    else
      return (
        <Tooltip title={tooltipTitle}>
          <span>
            <IconButton
              className={classes.disabled}
              href={!to ? null : typeof to === 'string' ? to : `${to.pathname}${to.search}${to.hash}`}
              disabled={disabled || loading}
              size="large"
              onClick={disabled || loading ? null : onClick}
              style={{ ...(loading ? { color: theme.palette.action.disabled } : color && { color: color }) }}
            >
              {icon}
              {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
            </IconButton>
          </span>
        </Tooltip>
      );
  }
);

type AlertActionProps<T = object> = T & {
  alert: AlertItem;
  speedDial?: boolean;
  open?: boolean;
  vertical?: boolean;
  permanent?: boolean;
  onClick?: () => void;
};

export const AlertHistory: React.FC<AlertActionProps> = React.memo(
  ({
    alert,
    speedDial = false,
    open = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertActionProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();

    const [viewHistory, setViewHistory] = useState<boolean>(false);

    const hasEvents = useMemo<boolean>(() => alert && alert.events && alert.events.length > 0, [alert]);

    return (
      <>
        <AlertActionButton
          tooltipTitle={t(hasEvents ? 'history' : 'history.none')}
          open={open}
          vertical={vertical}
          permanent={permanent}
          speedDial={speedDial}
          showSkeleton={!alert}
          color={hasEvents ? theme.palette.action.active : theme.palette.action.disabled}
          icon={
            <Badge badgeContent={hasEvents ? alert.events.length : 0}>
              <WorkHistoryOutlinedIcon color={hasEvents ? 'inherit' : 'disabled'} />
            </Badge>
          }
          onClick={() => {
            if (hasEvents) setViewHistory(true);
            onClick();
          }}
        />
        <AlertEventsTable alert={alert} viewHistory={viewHistory} setViewHistory={setViewHistory} />
      </>
    );
  }
);

export const AlertGroup: React.FC<AlertActionProps> = React.memo(
  ({
    alert,
    open = false,
    speedDial = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertActionProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const { user: currentUser } = useAppUser<CustomUser>();
    const { search, setSearchObject } = useSearchParams<AlertSearchParams>();

    const groupBy = useMemo<string>(() => {
      const g = search.get('group_by');
      if (!alert || !alert.group_count || !g) return null;
      else return `${g}:${getValueFromPath(alert, g) as string}`;
    }, [alert, search]);

    return (
      <AlertActionButton
        tooltipTitle={t('focus')}
        open={open}
        vertical={vertical}
        permanent={permanent}
        speedDial={speedDial}
        showSkeleton={!alert}
        authorized={
          currentUser.roles.includes('alert_view') &&
          alert?.group_count > 0 &&
          window.location.pathname.startsWith('/alerts')
        }
        color={theme.palette.action.active}
        icon={<CenterFocusStrongOutlinedIcon />}
        onClick={e => {
          onClick();
          e.preventDefault();
          if (!groupBy) return;

          window.dispatchEvent(
            new CustomEvent<Partial<AlertSearchParams>>('alertRefresh', { detail: { group_by: '', fq: [groupBy] } })
          );
          setSearchObject(p => ({ ...p, offset: 0, group_by: '', fq: [...p.fq, groupBy] }));
        }}
      />
    );
  }
);

export const AlertOwnership: React.FC<AlertActionProps> = React.memo(
  ({
    alert,
    open = false,
    speedDial = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertActionProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const classes = useStyles();
    const { apiCall } = useMyAPI();
    const { user: currentUser } = useAppUser<CustomUser>();
    const { showErrorMessage, showSuccessMessage } = useMySnackbar();
    const { search } = useSearchParams<AlertSearchParams>();

    const [confirmation, setConfirmation] = useState<boolean>(false);
    const [waiting, setWaiting] = useState<boolean>(false);

    const query = useMemo<SearchResult<AlertSearchParams>>(() => {
      if (!alert) return null;
      return search
        .set(p => {
          const f = `${p.group_by}:${getValueFromPath(alert, p.group_by) as string}`;
          return { ...p, q: p.group_by ? f : `alert_id:${alert.alert_id}` };
        })
        .filter(k => ['tc', 'tc_start', 'fq', 'q'].includes(k));
    }, [alert, search]);

    const handleTakeOwnership = useCallback(
      (prevAlert: AlertItem, q: string) => {
        if (!currentUser.roles.includes('alert_manage')) return;
        apiCall({
          url: `/api/v4/alert/ownership/batch/?${q}`,
          method: 'GET',
          onSuccess: ({ api_response }) => {
            if (!api_response.success) {
              showErrorMessage(t('take_ownership.error'));
              return;
            } else {
              const detail: Partial<AlertItem>[] = [{ ...prevAlert, owner: currentUser.username }];
              window.dispatchEvent(new CustomEvent<Partial<AlertItem>[]>('alertUpdate', { detail }));
              showSuccessMessage(t('take_ownership.success'));
            }
          },
          onFailure: ({ api_error_message }) => showErrorMessage(api_error_message),
          onEnter: () => setWaiting(true),
          onExit: () => {
            setWaiting(false);
            setConfirmation(false);
            onClick();
          }
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [currentUser, onClick, showErrorMessage, showSuccessMessage, t]
    );

    return (
      <>
        <AlertActionButton
          tooltipTitle={t('take_ownership')}
          open={open}
          vertical={vertical}
          permanent={permanent}
          speedDial={speedDial}
          showSkeleton={!alert}
          authorized={currentUser.roles.includes('alert_manage') && !alert?.owner}
          color={theme.palette.action.active}
          icon={<AssignmentIndIcon />}
          onClick={() => {
            setConfirmation(true);
            onClick();
          }}
        />
        {confirmation && (
          <ConfirmationDialog
            open={confirmation}
            handleClose={() => setConfirmation(false)}
            handleAccept={() => handleTakeOwnership(alert, query.toString())}
            title={t('actions.takeownershipdiag.header')}
            cancelText={t('actions.cancel')}
            acceptText={t('actions.ok')}
            waiting={waiting}
            children={
              search.get('group_by') ? (
                <Grid container rowGap={2}>
                  <Grid>{t('actions.takeownershipdiag.content.grouped')}</Grid>
                  <Grid item style={{ width: '100%' }}>
                    <Typography variant="subtitle2">{t('actions.takeownershipdiag.properties')}</Typography>
                    <Paper component="pre" variant="outlined" className={classes.preview}>
                      {!query || query.toString() === '' ? (
                        <div>{t('none')}</div>
                      ) : (
                        <AlertFiltersSelected
                          value={query.toObject()}
                          visible={['fq', 'q', 'sort', 'timerange']}
                          disabled
                        />
                      )}
                    </Paper>
                  </Grid>
                  <Grid>{t('actions.takeownershipdiag.confirm')}</Grid>
                </Grid>
              ) : (
                <Grid container rowGap={2}>
                  <Grid>
                    {t('actions.takeownershipdiag.content.single')}
                    <b>{`"${alert.alert_id}".`}</b>
                  </Grid>
                  <Grid>{t('actions.takeownershipdiag.confirm')}</Grid>
                </Grid>
              )
            }
          />
        )}
      </>
    );
  }
);

export const AlertSubmission: React.FC<AlertActionProps> = React.memo(
  ({
    alert,
    open = false,
    speedDial = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertActionProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const { user: currentUser } = useAppUser<CustomUser>();

    return (
      <AlertActionButton
        tooltipTitle={t('submission')}
        to={`/submission/${alert?.sid}`}
        open={open}
        vertical={vertical}
        permanent={permanent}
        speedDial={speedDial}
        showSkeleton={!alert}
        authorized={currentUser.roles.includes('submission_view')}
        color={theme.palette.action.active}
        icon={<ViewCarouselOutlinedIcon />}
        onClick={onClick}
      />
    );
  }
);

type AlertWorkflowProps = AlertActionProps<{ inDrawer?: boolean }>;

export const AlertWorkflow: React.FC<AlertWorkflowProps> = React.memo(
  ({
    alert,
    open = false,
    speedDial = false,
    inDrawer = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertWorkflowProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const { user: currentUser } = useAppUser<CustomUser>();
    const { search } = useSearchParams<AlertSearchParams>();

    const [openWorkflow, setOpenWorkflow] = useState<boolean>(false);

    const filteredSearch = useMemo<SearchResult<AlertSearchParams>>(() => {
      if (!alert) return null;
      return search.set(p => ({
        ...p,
        q:
          (speedDial || inDrawer) && p.group_by
            ? `${p.group_by}:${getValueFromPath(alert, p.group_by) as string}`
            : `alert_id:${alert.alert_id}`
      }));
    }, [alert, inDrawer, search, speedDial]);

    return (
      <>
        <AlertActionButton
          tooltipTitle={t('workflow_action')}
          open={open}
          vertical={vertical}
          permanent={permanent}
          speedDial={speedDial}
          showSkeleton={!filteredSearch}
          authorized={currentUser.roles.includes('alert_manage')}
          color={theme.palette.action.active}
          icon={<BiNetworkChart style={{ height: '1.3rem', width: '1.3rem' }} />}
          onClick={() => {
            onClick();
            setOpenWorkflow(o => !o);
          }}
        />
        <AlertWorkflowDrawer
          alerts={[alert]}
          search={filteredSearch}
          open={openWorkflow}
          onClose={() => setOpenWorkflow(false)}
        />
      </>
    );
  }
);

export const AlertSafelist: React.FC<AlertActionProps> = React.memo(
  ({
    alert,
    open = false,
    speedDial = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertActionProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const { apiCall } = useMyAPI();
    const { user: currentUser } = useAppUser<CustomUser>();
    const { showErrorMessage, showSuccessMessage } = useMySnackbar();

    const [loading, setLoading] = useState<boolean>(false);

    const hasSetNonMalicious = useMemo<boolean>(
      () => alert && alert.verdict.non_malicious.indexOf(currentUser.username) !== -1,
      [alert, currentUser.username]
    );

    const handleNonMaliciousChange = useCallback(
      (prevAlert: AlertItem) => {
        if (!currentUser.roles.includes('alert_manage')) return;
        apiCall({
          method: 'PUT',
          url: `/api/v4/alert/verdict/${prevAlert.alert_id}/non_malicious/`,
          onSuccess: ({ api_response }) => {
            if (!api_response.success) {
              showErrorMessage(t('verdict.error.non_malicious'));
              return;
            } else {
              const detail: Partial<AlertItem>[] = [
                {
                  ...prevAlert,
                  verdict: {
                    non_malicious: [...prevAlert.verdict.non_malicious, currentUser.username],
                    malicious: prevAlert.verdict.malicious.filter(v => v !== currentUser.username)
                  }
                }
              ];
              window.dispatchEvent(new CustomEvent<Partial<AlertItem>[]>('alertUpdate', { detail }));
              showSuccessMessage(t('verdict.success.non_malicious'));
            }
          },
          onFailure: ({ api_error_message }) => showErrorMessage(api_error_message),
          onEnter: () => setLoading(true),
          onExit: () => {
            setLoading(false);
            onClick();
          }
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [currentUser.username, onClick, showErrorMessage, showSuccessMessage, t]
    );

    return (
      <AlertActionButton
        tooltipTitle={t(hasSetNonMalicious ? 'verdict.non_malicious.set' : 'verdict.non_malicious.action')}
        open={open}
        loading={loading}
        vertical={vertical}
        permanent={permanent}
        speedDial={speedDial}
        showSkeleton={!alert}
        authorized={currentUser.roles.includes('alert_manage')}
        color={
          hasSetNonMalicious
            ? theme.palette.mode === 'dark'
              ? theme.palette.success.light
              : theme.palette.success.dark
            : theme.palette.action.active
        }
        icon={<VerifiedUserOutlinedIcon />}
        onClick={hasSetNonMalicious ? null : () => handleNonMaliciousChange(alert)}
      />
    );
  }
);

export const AlertBadlist: React.FC<AlertActionProps> = React.memo(
  ({
    alert,
    open = false,
    speedDial = false,
    vertical = false,
    permanent = false,
    onClick = () => null
  }: AlertActionProps) => {
    const { t } = useTranslation(['alerts']);
    const theme = useTheme();
    const { apiCall } = useMyAPI();
    const { user: currentUser } = useAppUser<CustomUser>();
    const { showErrorMessage, showSuccessMessage } = useMySnackbar();

    const [loading, setLoading] = useState<boolean>(false);

    const hasSetMalicious = useMemo<boolean>(
      () => alert && alert.verdict.malicious.indexOf(currentUser.username) !== -1,
      [alert, currentUser.username]
    );

    const handleMaliciousChange = useCallback(
      (prevAlert: AlertItem) => {
        if (!currentUser.roles.includes('alert_manage')) return;
        apiCall({
          method: 'PUT',
          url: `/api/v4/alert/verdict/${prevAlert.alert_id}/malicious/`,
          onSuccess: ({ api_response }) => {
            if (!api_response.success) {
              showErrorMessage(t('verdict.error.malicious'));
              return;
            } else {
              const detail: Partial<AlertItem>[] = [
                {
                  ...prevAlert,
                  verdict: {
                    malicious: [...prevAlert.verdict.malicious, currentUser.username],
                    non_malicious: prevAlert.verdict.non_malicious.filter(v => v !== currentUser.username)
                  }
                }
              ];
              window.dispatchEvent(new CustomEvent<Partial<AlertItem>[]>('alertUpdate', { detail }));
              showSuccessMessage(t('verdict.success.malicious'));
            }
          },
          onFailure: ({ api_error_message }) => showErrorMessage(api_error_message),
          onEnter: () => setLoading(true),
          onExit: () => {
            setLoading(false);
            onClick();
          }
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [currentUser.username, onClick, showErrorMessage, showSuccessMessage, t]
    );

    return (
      <AlertActionButton
        tooltipTitle={t(hasSetMalicious ? 'verdict.malicious.set' : 'verdict.malicious.action')}
        open={open}
        loading={loading}
        vertical={vertical}
        permanent={permanent}
        speedDial={speedDial}
        showSkeleton={!alert}
        authorized={currentUser.roles.includes('alert_manage')}
        color={
          hasSetMalicious
            ? theme.palette.mode === 'dark'
              ? theme.palette.error.light
              : theme.palette.error.dark
            : theme.palette.action.active
        }
        icon={<BugReportOutlinedIcon />}
        onClick={hasSetMalicious ? null : () => handleMaliciousChange(alert)}
      />
    );
  }
);

type Props = {
  alert: AlertItem;
  inDrawer?: boolean;
};

const WrappedAlertActions = ({ alert, inDrawer = false }: Props) => {
  const { t } = useTranslation('alerts');
  const theme = useTheme();
  const classes = useStyles();
  const location = useLocation();
  const { user: currentUser } = useAppUser<CustomUser>();

  const [open, setOpen] = useState<boolean>(false);
  const [render, setRender] = useState<boolean>(false);

  const prevSearch = useRef<string>('');

  const upSM = useMediaQuery(theme.breakpoints.up('sm'));

  const vertical = useMemo<boolean>(() => inDrawer && !upSM, [inDrawer, upSM]);
  const permanent = useMemo<boolean>(() => inDrawer && upSM, [inDrawer, upSM]);

  useEffect(() => {
    if (open || permanent) setRender(true);
  }, [open, permanent]);

  useEffect(() => {
    return () => setRender(false);
  }, []);

  useEffect(() => {
    if (location.search !== prevSearch.current) {
      setOpen(false);
      prevSearch.current = location.search;
    }
  }, [location.search]);

  if (
    !currentUser.roles.includes('submission_view') &&
    !currentUser.roles.includes('alert_manage') &&
    !alert?.group_count
  )
    return null;
  else
    return (
      <div
        style={{
          marginTop: vertical ? null : theme.spacing(-1),
          marginRight: vertical ? null : theme.spacing(-1)
        }}
      >
        <SpeedDial
          ariaLabel={t('action_menu')}
          classes={{
            actionsClosed: vertical ? null : classes.actionsClosed,
            root: permanent ? classes.permanentSpeedDial : null
          }}
          icon={
            <SpeedDialIcon
              icon={vertical ? <ExpandMoreIcon /> : <ChevronLeftIcon />}
              openIcon={vertical ? <ExpandLessIcon /> : <ChevronRightIcon />}
            />
          }
          direction={vertical ? 'down' : 'left'}
          open={open || permanent}
          onOpen={(_event, reason: OpenReason) => (reason !== 'toggle' ? null : setOpen(true))}
          onClose={(_event, reason: CloseReason) =>
            reason !== 'toggle' && reason !== 'escapeKeyDown' ? null : setOpen(false)
          }
          FabProps={{
            size: vertical ? 'medium' : 'small',
            color: 'primary',
            className: vertical ? classes.verticalSpeedDialFab : permanent ? classes.permanentSpeedDialFab : null
          }}
        >
          {!alert || !render
            ? [
                <AlertActionButton
                  key={`alert.default`}
                  open={true}
                  loading={false}
                  disabled={false}
                  vertical={vertical}
                  permanent={permanent}
                  speedDial={true}
                  showSkeleton={!alert}
                />
              ]
            : [
                <AlertBadlist
                  key={`${alert?.alert_id}.AlertBadlist`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  vertical={vertical}
                  permanent={permanent}
                />,
                <AlertSafelist
                  key={`${alert?.alert_id}.AlertSafelist`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  vertical={vertical}
                  permanent={permanent}
                />,
                <AlertWorkflow
                  key={`${alert?.alert_id}.AlertWorkflow`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  inDrawer={inDrawer}
                  vertical={vertical}
                  permanent={permanent}
                  onClick={() => setOpen(false)}
                />,
                <AlertSubmission
                  key={`${alert?.alert_id}.AlertSubmission`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  vertical={vertical}
                  permanent={permanent}
                  onClick={() => setOpen(false)}
                />,
                <AlertOwnership
                  key={`${alert?.alert_id}.AlertOwnership`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  vertical={vertical}
                  permanent={permanent}
                  onClick={() => setOpen(false)}
                />,
                <AlertGroup
                  key={`${alert?.alert_id}.AlertGroup`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  vertical={vertical}
                  permanent={permanent}
                  onClick={() => setOpen(false)}
                />,
                <AlertHistory
                  key={`${alert?.alert_id}.AlertHistory`}
                  alert={alert}
                  open={open || permanent}
                  speedDial
                  vertical={vertical}
                  permanent={permanent}
                  onClick={() => setOpen(false)}
                />
              ]}
        </SpeedDial>
      </div>
    );
};

export const AlertActions = React.memo(WrappedAlertActions);
export default AlertActions;
