import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Alert, CircularProgress, Collapse, Divider, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import AIMarkdown from 'components/visual/AiMarkdown';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type AISummarySectionProps = {
  type: 'submission' | 'file';
  id: string;
  noTitle?: boolean;
  noCollapse?: boolean;
  detailed?: boolean;
  archiveOnly?: boolean;
};

const WrappedAISummarySection: React.FC<AISummarySectionProps> = ({
  type,
  id,
  noTitle = false,
  noCollapse = false,
  detailed = false,
  archiveOnly = false
}) => {
  const { t, i18n } = useTranslation(['submissionDetail']);
  const theme = useTheme();
  const { configuration } = useALContext();
  const { apiCall } = useMyAPI();

  const [open, setOpen] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState(null);

  const getReportSummary = useCallback(
    noCache => {
      const params = [`lang=${i18n.language === 'en' ? 'english' : 'french'}`];
      if (detailed) {
        params.push('detailed');
      }
      if (noCache) {
        params.push('no_cache');
      }
      if (archiveOnly) {
        params.push('archive_only');
      }
      apiCall({
        allowCache: !noCache,
        url: `/api/v4/${type}/ai/${id}/${params ? `?${params.join('&')}` : ''}`,
        onSuccess: api_data => {
          if (error !== null) setError(null);
          setSummary(api_data.api_response.content);
          setTruncated(api_data.api_response.truncated);
        },
        onFailure: api_data => {
          setError(api_data.api_error_message);
          if (summary !== null) {
            setSummary(null);
            setTruncated(false);
          }
        },
        onEnter: () => setAnalysing(true),
        onExit: () => setAnalysing(false)
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, error, id]
  );

  useEffect(() => {
    if (configuration.ui.ai.enabled && id) {
      getReportSummary(false);
    }

    return () => {
      setError(null);
      setSummary(null);
      setTruncated(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div style={{ paddingTop: !noTitle ? theme.spacing(2) : null }}>
      {!noTitle && (
        <>
          <Typography
            variant="h6"
            onClick={
              noCollapse
                ? null
                : () => {
                    setOpen(!open);
                  }
            }
            sx={{
              ...(!noCollapse && {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                '&:hover, &:focus': {
                  color: theme.palette.text.secondary
                }
              })
            }}
          >
            <span>{t('ai_summary')}</span>
            {noCollapse ? null : open ? <ExpandLess /> : <ExpandMore />}
          </Typography>
          <Divider />
        </>
      )}
      <div style={{ paddingTop: !noTitle ? theme.spacing(2) : null, pageBreakInside: 'avoid' }}>
        <Collapse in={open} timeout="auto">
          {analysing || (!summary && !error) ? (
            <div style={{ height: '12rem', borderRadius: '4px' }}>
              <div
                style={{
                  textAlign: 'center',
                  position: 'relative',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div style={{ paddingBottom: theme.spacing(2) }}>{t('analysing_report')}</div>
                <CircularProgress variant="indeterminate" />
              </div>
            </div>
          ) : summary ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AIMarkdown markdown={summary} truncated={truncated} />
            </div>
          ) : error ? (
            <Alert severity="error" style={{ marginBottom: theme.spacing(2) }}>
              {error}
            </Alert>
          ) : (
            <Skeleton variant="rectangular" style={{ height: '12rem', borderRadius: '4px' }} />
          )}
          {(summary || error) && (
            <div>
              <Tooltip title={t('powered_by_ai.tooltip')} placement="top-end">
                <div
                  onClick={() => getReportSummary(true)}
                  style={{
                    float: 'right',
                    color: theme.palette.text.disabled,
                    fontSize: 'smaller',
                    cursor: 'pointer'
                  }}
                >
                  {t('powered_by_ai')}
                </div>
              </Tooltip>
            </div>
          )}
        </Collapse>
      </div>
    </div>
  );
};
const AISummarySection = React.memo(WrappedAISummarySection);

export default AISummarySection;
