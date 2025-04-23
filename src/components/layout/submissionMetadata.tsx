import ClearIcon from '@mui/icons-material/Clear';
import { Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import useALContext from 'components/hooks/useALContext';
import { useTranslation } from 'react-i18next';

type ExternalSourcesProps = {
  submissionMetadata: { [field_name: string]: any };
  setSubmissionMetadata: (newMeta) => void;
};

function SubmissionMetadata({ submissionMetadata, setSubmissionMetadata }: ExternalSourcesProps) {
  const { t } = useTranslation(['submit']);
  const theme = useTheme();
  const { configuration } = useALContext();
  var fileSources = [];
  for (const v of Object.values(configuration.submission.file_sources || [])) {
    v.sources.forEach(i => (fileSources.indexOf(i) === -1 ? fileSources.push(i) : null));
  }
  return (
    submissionMetadata &&
    Object.keys(submissionMetadata).length !== 0 && (
      <div style={{ textAlign: 'start', marginTop: theme.spacing(3), marginBottom: theme.spacing(3) }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography style={{ flexGrow: 1 }} variant="subtitle1">
            {t('options.submission.metadata')}
          </Typography>
          <Tooltip title={t('options.submission.metadata.clear')}>
            <IconButton onClick={() => setSubmissionMetadata({})}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div>
          {Object.keys(submissionMetadata).map((meta, i) => (
            <Grid container key={i}>
              <Grid
                size={{ xs: 12, sm: 3, lg: 2 }}
                sx={{
                  overflowX: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                }}
              >
                <span style={{ fontWeight: 500 }}>{meta}</span>
              </Grid>
              <Grid size={{ xs: 12, sm: 9, lg: 10 }} style={{ wordBreak: 'break-word' }}>
                {submissionMetadata[meta].toString()}
              </Grid>
            </Grid>
          ))}
        </div>
      </div>
    )
  );
}

export default SubmissionMetadata;
