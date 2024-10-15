import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import HttpsOutlinedIcon from '@mui/icons-material/HttpsOutlined';
import NoEncryptionOutlinedIcon from '@mui/icons-material/NoEncryptionOutlined';
import type { Theme } from '@mui/material';
import {
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageFullWidth from 'commons/components/pages/PageFullWidth';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import type { Role } from 'components/models/base/user';
import type { SiteMap } from 'components/models/ui';
import type { CustomUser } from 'components/models/ui/user';
import type { PossibleColor } from 'components/models/utils/color';
import CustomChip from 'components/visual/CustomChip';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

const StyledTableCell = withStyles((theme: Theme) =>
  createStyles({
    root: {
      paddingRight: theme.spacing(1),
      paddingLeft: theme.spacing(1),
      [theme.breakpoints.up('md')]: {
        wordBreak: 'break-word'
      }
    },
    head: {
      backgroundColor: theme.palette.mode === 'dark' ? '#404040' : '#EEE',
      whiteSpace: 'nowrap'
    }
  })
)(TableCell);

export default function SiteMapPage() {
  const { t } = useTranslation(['adminSiteMap']);
  const theme = useTheme();
  const { configuration } = useALContext();
  const { apiCall } = useMyAPI();
  const { user: currentUser } = useAppUser<CustomUser>();

  const [siteMap, setSiteMap] = useState<SiteMap>(null);

  const reqMapColor: Record<Role, PossibleColor> = {
    administration: 'error',
    alert_manage: 'info',
    alert_view: 'default',
    apikey_access: 'default',
    archive_comment: 'default',
    archive_download: 'warning',
    archive_manage: 'info',
    archive_trigger: 'warning',
    archive_view: 'default',
    assistant_use: 'info',
    badlist_manage: 'info',
    badlist_view: 'default',
    bundle_download: 'warning',
    external_query: 'default',
    file_detail: 'default',
    file_download: 'warning',
    file_purge: 'default',
    heuristic_view: 'default',
    obo_access: 'default',
    replay_system: 'warning',
    replay_trigger: 'warning',
    retrohunt_run: 'default',
    retrohunt_view: 'default',
    safelist_manage: 'info',
    safelist_view: 'default',
    self_manage: 'info',
    signature_download: 'warning',
    signature_import: 'success',
    signature_manage: 'info',
    signature_view: 'default',
    submission_create: 'success',
    submission_delete: 'error',
    submission_manage: 'info',
    submission_view: 'default',
    workflow_manage: 'info',
    workflow_view: 'default'
  };

  useEffect(() => {
    if (currentUser.is_admin) {
      apiCall<SiteMap>({
        method: 'GET',
        url: '/api/site_map/',
        onSuccess: api_data => setSiteMap(api_data.api_response)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.is_admin]);

  return currentUser.is_admin ? (
    <PageFullWidth margin={4}>
      <div style={{ marginBottom: theme.spacing(2), textAlign: 'left' }}>
        <Typography variant="h4">{t('title')}</Typography>
        {siteMap ? (
          <Typography variant="caption">{`${siteMap.length} ${t('caption')}`}</Typography>
        ) : (
          <Skeleton width="10rem" />
        )}
      </div>
      {siteMap ? (
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell>{t('header.url')}</StyledTableCell>
                <StyledTableCell>{t('header.function')}</StyledTableCell>
                <StyledTableCell>{t('header.methods')}</StyledTableCell>
                <StyledTableCell>{t('header.protected')}</StyledTableCell>
                {configuration.ui.enforce_quota && <StyledTableCell>{t('header.quota')}</StyledTableCell>}
                <StyledTableCell>{t('header.roles')}</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {siteMap.map((path, id) => (
                <TableRow key={id} hover>
                  <StyledTableCell>{path.url}</StyledTableCell>
                  <StyledTableCell>{path.function}</StyledTableCell>
                  <StyledTableCell>
                    {path.methods && path.methods.map((method, mid) => <div key={mid}>{method}</div>)}
                  </StyledTableCell>
                  <StyledTableCell>
                    {path.protected ? (
                      <HttpsOutlinedIcon color="primary" />
                    ) : (
                      <NoEncryptionOutlinedIcon color="error" />
                    )}
                  </StyledTableCell>
                  {configuration.ui.enforce_quota && (
                    <StyledTableCell>
                      {path.count_towards_quota && <DataUsageOutlinedIcon color="primary" />}
                    </StyledTableCell>
                  )}
                  <StyledTableCell>
                    {path.required_type &&
                      path.required_type.map((req, rid) => (
                        <div key={rid}>
                          <CustomChip
                            mono
                            type="rounded"
                            color={reqMapColor[req]}
                            size="tiny"
                            label={t(`role.${req}`)}
                          />
                        </div>
                      ))}
                  </StyledTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Skeleton variant="rectangular" height="10rem" style={{ borderRadius: '4px' }} />
      )}
    </PageFullWidth>
  ) : (
    <Navigate to="/forbidden" replace />
  );
}
