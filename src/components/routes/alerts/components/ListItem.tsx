import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { Grid, Tooltip, useTheme } from '@mui/material';
import useALContext from 'components/hooks/useALContext';
import type { Alert, DetailedItem } from 'components/models/base/alert';
import { ChipList } from 'components/visual/ChipList';
import CustomChip from 'components/visual/CustomChip';
import Moment from 'components/visual/Moment';
import Verdict from 'components/visual/Verdict';
import { verdictRank, verdictToColor } from 'helpers/utils';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertExtendedScan, AlertListChip, AlertListChipDetailed, AlertPriority, AlertStatus } from './Components';

type Props = {
  item: Alert;
};

const WrappedAlertListItem = ({ item }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation('alerts');
  const { configuration } = useALContext();

  const subject = useMemo<string>(() => {
    let data = '';
    for (const subItem of configuration.ui.alerting_meta.subject) {
      const metaVal = item.metadata[subItem];
      if (metaVal !== undefined && metaVal !== null) {
        data = metaVal;
        break;
      }
    }
    return data;
  }, [configuration.ui.alerting_meta.subject, item.metadata]);

  const url = useMemo<string>(() => {
    let data = '';
    for (const subItem of configuration.ui.alerting_meta.url) {
      const metaVal = item.metadata[subItem];
      if (metaVal !== undefined && metaVal !== null) {
        data = metaVal;
        break;
      }
    }
    return data;
  }, [configuration.ui.alerting_meta.url, item.metadata]);

  const detailedItemCompare = useCallback((a: DetailedItem, b: DetailedItem) => {
    const aVerdict = verdictRank(a.verdict);
    const bVerdict = verdictRank(b.verdict);

    if (aVerdict === bVerdict) {
      return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
    } else {
      return aVerdict < bVerdict ? -1 : 1;
    }
  }, []);

  return (
    <div style={{ padding: theme.spacing(2) }}>
      <Grid container spacing={1}>
        <Grid item xs={12} md={8}>
          <div style={{ display: 'flex' }}>
            <AlertExtendedScan name={item.extended_scan} />
            <AlertPriority name={item.priority} />
            {item.group_count && <div style={{ marginLeft: theme.spacing(1) }}>{item.group_count}x</div>}
            <div>
              {subject && (
                <div
                  style={{
                    marginLeft: theme.spacing(1),
                    wordBreak: 'break-word'
                  }}
                >
                  {subject}
                </div>
              )}
              <div
                style={{
                  marginLeft: theme.spacing(1),
                  wordBreak: 'break-all',
                  color: subject ? theme.palette.text.secondary : theme.palette.text.primary
                }}
              >
                {url || item.file.name}
              </div>
            </div>
          </div>
        </Grid>
        <Grid item xs={6} md={2} style={{ minHeight: theme.spacing(5) }}>
          <CustomChip
            size="tiny"
            label={item.file.type}
            variant="outlined"
            style={{ marginBottom: '11px', marginRight: theme.spacing(0.5) }}
          />
          {item.verdict.malicious.length > item.verdict.non_malicious.length ? (
            <Tooltip
              title={`${item.verdict.malicious.length}/${
                item.verdict.malicious.length + item.verdict.non_malicious.length
              } ${t('verdict.user.malicious')}`}
            >
              <BugReportOutlinedIcon />
            </Tooltip>
          ) : null}
          {item.verdict.non_malicious.length > item.verdict.malicious.length ? (
            <Tooltip
              title={`${item.verdict.non_malicious.length}/${
                item.verdict.malicious.length + item.verdict.non_malicious.length
              } ${t('verdict.user.non_malicious')}`}
            >
              <VerifiedUserOutlinedIcon />
            </Tooltip>
          ) : null}
          {item.owner ? (
            <>
              <Tooltip title={`${t('owned_by')} ${item.owner}`}>
                <PersonOutlineOutlinedIcon />
              </Tooltip>
            </>
          ) : item.hint_owner ? (
            <>
              <Tooltip title={t('hint_owned_by')}>
                <GroupOutlinedIcon />
              </Tooltip>
            </>
          ) : null}
        </Grid>
        <Grid item xs={6} md={2} style={{ textAlign: 'right' }}>
          <Moment variant="fromNow">{item.reporting_ts}</Moment>
        </Grid>
        <Grid item xs={12} md={2}>
          <Grid container spacing={1}>
            <Grid item>
              <CustomChip size="tiny" variant="outlined" label={item.type} style={{ cursor: 'inherit' }} />
            </Grid>
            <Grid item>
              <AlertStatus name={item.status} size={'tiny' as const} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChipList
            items={item.label
              .sort()
              .map(label => ({
                label,
                size: 'tiny' as const,
                variant: 'outlined' as const,
                style: { cursor: 'inherit' }
              }))
              .concat(
                item.al.detailed
                  ? item.al.detailed.attrib.sort(detailedItemCompare).map(attrib_item => ({
                      label: attrib_item.subtype ? `${attrib_item.value} - ${attrib_item.subtype}` : attrib_item.value,
                      size: 'tiny' as const,
                      color: verdictToColor(attrib_item.verdict),
                      variant: 'outlined' as const,
                      style: { cursor: 'inherit' }
                    }))
                  : item.al.attrib.map(label => ({
                      label,
                      size: 'tiny' as const,
                      variant: 'outlined' as const,
                      style: { cursor: 'inherit' }
                    }))
              )}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          {item.al.detailed ? (
            <>
              <AlertListChipDetailed items={item.al.detailed.av} title="AV" size="tiny" />
              <AlertListChipDetailed items={item.al.detailed.ip} title="IP" size="tiny" />
              <AlertListChipDetailed items={item.al.detailed.domain} title="DOM" size="tiny" />
              <AlertListChipDetailed items={item.al.detailed.uri} title="URI" size="tiny" />
            </>
          ) : (
            <>
              <AlertListChip items={item.al.av} title="AV" size="tiny" />
              <AlertListChip items={item.al.ip} title="IP" size="tiny" />
              <AlertListChip items={item.al.domain} title="DOM" size="tiny" />
              <AlertListChip items={item.al.uri} title="URI" size="tiny" />
            </>
          )}
        </Grid>
        <Grid item xs={12} md={2} style={{ textAlign: 'right' }}>
          <Verdict score={item.al.score} />
        </Grid>
      </Grid>
    </div>
  );
};

const AlertListItem = React.memo(WrappedAlertListItem);
export default AlertListItem;
