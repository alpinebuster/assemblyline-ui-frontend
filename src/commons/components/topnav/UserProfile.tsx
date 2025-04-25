import { SelfImprovement } from '@mui/icons-material';
import {
  Box,
  ClickAwayListener,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  Popper,
  styled,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import type { AppBarUserMenuElement } from 'commons/components//app/AppConfigs';
import { useAppConfigs, useAppLayout } from 'commons/components/app/hooks';
import AppAvatar from 'commons/components/display/AppAvatar';
import ThemeSelection from 'commons/components/topnav/ThemeSelection';
import useALContext from 'components/hooks/useALContext';
import useQuota from 'components/hooks/useQuota';
import { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export const AppUserAvatar = styled(AppAvatar)(({ theme }) => ({
  width: theme.spacing(5),
  height: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    width: theme.spacing(4),
    height: theme.spacing(4)
  }
}));

type AppBarUserMenuType = 'usermenu' | 'adminmenu';

const UserProfile = () => {
  const theme = useTheme();
  const anchorRef = useRef<HTMLButtonElement>(undefined);
  const configs = useAppConfigs();
  const { user, configuration } = useALContext();
  const layout = useAppLayout();
  const { t } = useTranslation();
  const { apiQuotaRemaining, submissionQuotaRemaining } = useQuota();
  const [open, setOpen] = useState<boolean>(false);
  const onProfileClick = useCallback(() => setOpen(_open => !_open), []);
  const onClickAway = useCallback(() => setOpen(false), []);
  const renderThemeSelection = useCallback(
    (enabled: boolean) => {
      if (
        enabled &&
        (configs.allowPersonalization || configs.preferences.allowTranslate || configs.preferences.allowReset)
      ) {
        return (
          <div>
            <Divider />
            <ThemeSelection />
          </div>
        );
      }
      return null;
    },
    [configs.allowPersonalization, configs.preferences.allowTranslate, configs.preferences.allowReset]
  );

  const renderQuotas = useCallback(() => {
    const usedAPIPercent = ((user.api_daily_quota - apiQuotaRemaining) / user.api_daily_quota) * 100;
    const usedSubmissionPercent =
      ((user.submission_daily_quota - submissionQuotaRemaining) / user.submission_daily_quota) * 100;

    if (
      (user.api_daily_quota !== 0 && apiQuotaRemaining !== null) ||
      (user.submission_daily_quota !== 0 && submissionQuotaRemaining !== null)
    ) {
      return (
        <div>
          <Divider />
          <List dense subheader={<ListSubheader disableSticky>{t('quotas')}</ListSubheader>}>
            {user.api_daily_quota !== 0 && apiQuotaRemaining !== null && (
              <Tooltip title={`${apiQuotaRemaining} ${t('quotas.api.remaining')}`} placement="left">
                <ListItem>
                  <span style={{ whiteSpace: 'nowrap' }}>{t('quotas.api')}</span>
                  <LinearProgress
                    variant="determinate"
                    color={usedAPIPercent < 65 ? 'success' : usedAPIPercent < 90 ? 'warning' : 'error'}
                    value={usedAPIPercent}
                    style={{ marginLeft: theme.spacing(2), width: '100%' }}
                  />
                </ListItem>
              </Tooltip>
            )}
            {user.submission_daily_quota !== 0 && submissionQuotaRemaining !== null && (
              <Tooltip title={`${submissionQuotaRemaining} ${t('quotas.submission.remaining')}`} placement="left">
                <ListItem>
                  <span style={{ whiteSpace: 'nowrap' }}>{t('quotas.submission')}</span>
                  <LinearProgress
                    variant="determinate"
                    color={usedSubmissionPercent < 65 ? 'success' : usedSubmissionPercent < 90 ? 'warning' : 'error'}
                    value={usedSubmissionPercent}
                    style={{ marginLeft: theme.spacing(2), width: '100%' }}
                  />
                </ListItem>
              </Tooltip>
            )}
          </List>
        </div>
      );
    }
    return null;
  }, [apiQuotaRemaining, submissionQuotaRemaining, t, theme, user.api_daily_quota, user.submission_daily_quota]);

  const renderMenu = useCallback(
    (type: AppBarUserMenuType, menuItems: AppBarUserMenuElement[], title: string, i18nKey: string) => {
      if (menuItems !== undefined && menuItems !== null && menuItems.length !== 0) {
        return (
          <div>
            <Divider />
            <List dense subheader={<ListSubheader disableSticky>{i18nKey ? t(i18nKey) : title}</ListSubheader>}>
              {type === 'usermenu' && configs.preferences.allowFocusMode && (
                <Tooltip title={t('personalization.focus.mode.tooltip')}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => layout.setFocus(_focus => !_focus)} id="personalization-focusmode">
                      <ListItemIcon>
                        <SelfImprovement />
                      </ListItemIcon>
                      <ListItemText>{t('personalization.focus.mode.label')}</ListItemText>
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}

              {menuItems.map((a, i) =>
                a.element ? (
                  <ListItem key={`${type}-${i}`}>{a.element}</ListItem>
                ) : (
                  <ListItemButton component={Link} to={a.route} key={`${type}-${i}`}>
                    {a.icon && <ListItemIcon>{a.icon}</ListItemIcon>}
                    <ListItemText>{a.i18nKey ? t(a.i18nKey) : a.title}</ListItemText>
                  </ListItemButton>
                )
              )}
            </List>
          </div>
        );
      }
      return null;
    },
    [t, configs.preferences.allowFocusMode, layout]
  );

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <div>
        <Tooltip title={t('usermenu')}>
          <IconButton
            ref={anchorRef}
            edge="end"
            sx={{
              padding: '6px',
              marginLeft: theme.spacing(0),
              marginRight: theme.spacing(0)
            }}
            onClick={onProfileClick}
            size="large"
          >
            <AppUserAvatar
              sx={{
                fontWeight: 500
              }}
              alt={user.name}
              url={user.avatar}
              email={user.email}
            >
              {user.name
                .split(' ')
                .filter(w => w !== '')
                .splice(0, 2)
                .map(n => (n ? n[0].toUpperCase() : ''))
                .join('')}
            </AppUserAvatar>
          </IconButton>
        </Tooltip>
        <Popper
          sx={{ zIndex: theme.zIndex.appBar + 200, minWidth: '280px' }}
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-end"
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={250}>
              <Paper style={{ padding: theme.spacing(1) }} elevation={4}>
                <List disablePadding>
                  <ListItem disableGutters dense>
                    <Box
                      sx={{
                        display: 'flex',
                        paddingTop: 2,
                        paddingBottom: 2,
                        paddingLeft: 3,
                        paddingRight: 3,
                        alignItems: 'center'
                      }}
                    >
                      <AppAvatar
                        sx={{
                          width: theme.spacing(8),
                          height: theme.spacing(8),
                          fontWeight: 500,
                          fontSize: theme.spacing(3.5)
                        }}
                        alt={user.name}
                        url={user.avatar}
                        email={user.email}
                      >
                        {user.name
                          .split(' ')
                          .filter(w => w !== '')
                          .splice(0, 2)
                          .map(n => (n ? n[0].toUpperCase() : ''))
                          .join('')}
                      </AppAvatar>
                      <Box sx={{ paddingLeft: 2 }}>
                        <Typography variant="body1" noWrap>
                          <b>{user.name}</b>
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                </List>
                {configuration.ui.enforce_quota &&
                  (user.api_daily_quota !== 0 || user.submission_daily_quota !== 0) &&
                  renderQuotas()}
                {renderMenu(
                  'usermenu',
                  configs.preferences.topnav.userMenu,
                  configs.preferences.topnav.userMenuTitle,
                  configs.preferences.topnav.userMenuI18nKey
                )}
                {user.is_admin &&
                  renderMenu(
                    'adminmenu',
                    configs.preferences.topnav.adminMenu,
                    configs.preferences.topnav.adminMenuTitle,
                    configs.preferences.topnav.adminMenuI18nKey
                  )}
                {renderThemeSelection(configs.preferences.topnav.themeSelectionMode === 'profile')}
              </Paper>
            </Fade>
          )}
        </Popper>
      </div>
    </ClickAwayListener>
  );
};

export default memo(UserProfile);
