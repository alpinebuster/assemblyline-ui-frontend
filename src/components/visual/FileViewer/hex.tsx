import { Alert, LinearProgress } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useMyAPI from 'components/hooks/useMyAPI';
import type { CustomUser } from 'components/models/ui/user';
import ForbiddenPage from 'components/routes/403';
import { HexViewerApp } from 'components/visual/HexViewer';
import React, { useEffect, useState } from 'react';

const useStyles = makeStyles(theme => ({
  wrapper: {
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#FAFAFA',
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: theme.spacing(2),
    paddingTop: theme.spacing(2)
  }
}));

type Props = {
  sha256: string;
};

const WrappedHexSection: React.FC<Props> = ({ sha256 }) => {
  const classes = useStyles();
  const { apiCall } = useMyAPI();
  const { user: currentUser } = useAppUser<CustomUser>();

  const [data, setData] = useState<string>(null);
  const [error, setError] = useState<string>(null);

  useEffect(() => {
    if (!sha256 || data) return;
    apiCall({
      url: `/api/v4/file/hex/${sha256}/?bytes_only=true`,
      allowCache: true,
      onEnter: () => {
        setData(null);
        setError(null);
      },
      onSuccess: api_data => setData(api_data.api_response),
      onFailure: api_data => setError(api_data.api_error_message)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sha256]);

  useEffect(() => {
    return () => setData(null);
  }, [sha256]);

  if (!currentUser.roles.includes('file_detail')) return <ForbiddenPage />;
  else if (error) return <Alert severity="error">{error}</Alert>;
  else if (!data) return <LinearProgress />;
  else
    return (
      <div className={classes.wrapper}>
        <HexViewerApp data={data} />
      </div>
    );
};

export const HexSection = React.memo(WrappedHexSection);
export default HexSection;
