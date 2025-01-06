import BlockIcon from '@mui/icons-material/Block';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined';
import { Grid, useMediaQuery, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageFullWidth from 'commons/components/pages/PageFullWidth';
import PageHeader from 'commons/components/pages/PageHeader';
import useALContext from 'components/hooks/useALContext';
import useDrawer from 'components/hooks/useDrawer';
import useMyAPI from 'components/hooks/useMyAPI';
import type { Signature } from 'components/models/base/signature';
import type { SearchResult } from 'components/models/ui/search';
import type { CustomUser } from 'components/models/ui/user';
import ForbiddenPage from 'components/routes/403';
import FileDownloader from 'components/visual/FileDownloader';
import SearchHeader from 'components/visual/SearchBar/SearchHeader';
import type { SearchParams } from 'components/visual/SearchBar/SearchParams';
import { createSearchParams } from 'components/visual/SearchBar/SearchParams';
import { SearchParamsProvider, useSearchParams } from 'components/visual/SearchBar/SearchParamsContext';
import type { SearchParamsResult } from 'components/visual/SearchBar/SearchParser';
import { DEFAULT_SUGGESTION } from 'components/visual/SearchBar/search-textfield';
import SignaturesTable from 'components/visual/SearchResult/signatures';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';
import SignatureDetail from './signature_detail';

const SIGNATURES_PARAMS = createSearchParams(p => ({
  query: p.string(''),
  offset: p.number(0).min(0).hidden().ignored(),
  rows: p.number(25).enforced().hidden().ignored(),
  sort: p.string('type asc').ignored(),
  filters: p.filters([]),
  track_total_hits: p.number(10000).nullable().ignored(),
  refresh: p.boolean(false).hidden().ignored()
}));

type SignaturesParams = SearchParams<typeof SIGNATURES_PARAMS>;

const SignaturesSearch = () => {
  const { t } = useTranslation(['manageSignatures']);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { apiCall } = useMyAPI();

  const { indexes } = useALContext();
  const { user: currentUser } = useAppUser<CustomUser>();
  const { globalDrawerOpened, setGlobalDrawer, closeGlobalDrawer } = useDrawer();
  const { search, setSearchParams, setSearchObject } = useSearchParams<SignaturesParams>();

  const [signatureResults, setSignatureResults] = useState<SearchResult<Signature>>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const isXL = useMediaQuery(theme.breakpoints.only('xl'));

  const suggestions = useMemo<string[]>(
    () => [...Object.keys(indexes.signature).filter(name => indexes.signature[name].indexed), ...DEFAULT_SUGGESTION],
    [indexes.signature]
  );

  const downloadLink = useMemo<string>(
    () =>
      search
        .set(o => ({ ...o, query: [o.query || '*', ...o.filters].join(' && ') }))
        .pick(['query'])
        .toString(),
    [search]
  );

  const handleReload = useCallback(
    (body: SearchParamsResult<SignaturesParams>) => {
      if (!currentUser.roles.includes('signature_view')) return;

      apiCall<SearchResult<Signature>>({
        url: '/api/v4/search/signature/',
        method: 'POST',
        body: body
          .set(o => ({ ...o, query: o.query || '*' }))
          .omit(['refresh'])
          .toObject(),
        onSuccess: ({ api_response }) => setSignatureResults(api_response),
        onEnter: () => setSearching(true),
        onExit: () => setSearching(false)
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.roles]
  );

  const setSignatureID = useCallback(
    (sig_id: string) => navigate(`${location.pathname}${location.search || ''}#${sig_id}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search]
  );

  const handleSignatureUpdated = () => {
    if (!isXL) closeGlobalDrawer();
    setTimeout(() => window.dispatchEvent(new CustomEvent('reloadSignatures')), 1000);
  };

  const handleSignatureDeleted = () => {
    closeGlobalDrawer();
    setTimeout(() => window.dispatchEvent(new CustomEvent('reloadSignatures')), 1000);
  };

  useEffect(() => {
    if (!location.hash || globalDrawerOpened || !signatureResults) return;
    navigate(`${location.pathname}${location.search || ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDrawerOpened]);

  useEffect(() => {
    if (location.hash) {
      setGlobalDrawer(
        <SignatureDetail
          signature_id={location.hash.substr(1)}
          onUpdated={handleSignatureUpdated}
          onDeleted={handleSignatureDeleted}
        />
      );
    } else {
      closeGlobalDrawer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  useEffect(() => {
    handleReload(search);
  }, [handleReload, search]);

  useEffect(() => {
    function reload() {
      setSearchObject(o => ({ ...o, offset: 0, refresh: !o.refresh }));
    }

    window.addEventListener('reloadSignatures', reload);
    return () => {
      window.removeEventListener('reloadSignatures', reload);
    };
  }, [setSearchObject]);

  return currentUser.roles.includes('signature_view') ? (
    <PageFullWidth margin={4}>
      <div style={{ paddingBottom: theme.spacing(2) }}>
        <Grid container alignItems="center">
          <Grid item xs>
            <Typography variant="h4">{t('title')}</Typography>
          </Grid>
          {currentUser.roles.includes('signature_download') && (
            <Grid item xs style={{ textAlign: 'right', flexGrow: 0 }}>
              <FileDownloader
                icon={<GetAppOutlinedIcon />}
                link={`/api/v4/signature/download/?${downloadLink}`}
                tooltip={t('download_desc')}
              />
            </Grid>
          )}
        </Grid>
      </div>

      <PageHeader isSticky>
        <div style={{ paddingTop: theme.spacing(1) }}>
          <SearchHeader
            params={search.toParams()}
            loading={searching}
            results={signatureResults}
            resultLabel={
              search.get('query')
                ? t(`filtered${signatureResults?.total === 1 ? '' : 's'}`)
                : t(`total${signatureResults?.total === 1 ? '' : 's'}`)
            }
            onChange={v => setSearchParams(v)}
            paramDefaults={search.defaults().toObject()}
            searchInputProps={{ placeholder: t('filter'), options: suggestions }}
            actionProps={[
              {
                tooltip: { title: t('noisy') },
                icon: { children: <RecordVoiceOverOutlinedIcon /> },
                button: {
                  onClick: () => setSearchObject(o => ({ ...o, offset: 0, filters: [...o.filters, 'status:NOISY'] }))
                }
              },
              {
                tooltip: { title: t('disabled') },
                icon: { children: <BlockIcon /> },
                button: {
                  onClick: () => setSearchObject(o => ({ ...o, offset: 0, filters: [...o.filters, 'status:DISABLED'] }))
                }
              }
            ]}
          />
        </div>
      </PageHeader>

      <div style={{ paddingTop: theme.spacing(2), paddingLeft: theme.spacing(0.5), paddingRight: theme.spacing(0.5) }}>
        <SignaturesTable signatureResults={signatureResults} setSignatureID={setSignatureID} />
      </div>
    </PageFullWidth>
  ) : (
    <ForbiddenPage />
  );
};

const WrappedSignaturesPage = () => (
  <SearchParamsProvider params={SIGNATURES_PARAMS}>
    <SignaturesSearch />
  </SearchParamsProvider>
);

export const SignaturesPage = React.memo(WrappedSignaturesPage);
export default SignaturesPage;
