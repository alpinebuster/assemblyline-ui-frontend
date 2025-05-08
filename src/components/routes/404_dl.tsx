import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import PageCenter from 'commons/components/pages/PageCenter';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation(['error404']);
  const theme = useTheme();
  return (
    <PageCenter width="65%" margin={4}>
      <div style={{ paddingTop: theme.spacing(10), paddingBottom: theme.spacing(6) }}>
        <img alt={t('dl.alt')} src="/images/dead_link.png" style={{ maxHeight: '300px', maxWidth: '90%' }} />
      </div>
      <div>
        <Typography variant="h6">{t('dl.description')}</Typography>
      </div>
    </PageCenter>
  );
};

export default NotFoundPage;
