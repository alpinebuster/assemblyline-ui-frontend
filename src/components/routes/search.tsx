import ArchiveIcon from '@mui/icons-material/Archive';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import type { Theme } from '@mui/material';
import { IconButton, Paper, Tab, Tabs, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import PageFullWidth from 'commons/components/pages/PageFullWidth';
import PageHeader from 'commons/components/pages/PageHeader';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { AlertIndexed } from 'components/models/base/alert';
import type { FileIndexed } from 'components/models/base/file';
import type { ResultIndexed } from 'components/models/base/result';
import type { RetrohuntIndexed } from 'components/models/base/retrohunt';
import type { SignatureIndexed } from 'components/models/base/signature';
import type { SubmissionIndexed } from 'components/models/base/submission';
import type { Role } from 'components/models/base/user';
import type { SearchResult } from 'components/models/ui/search';
import type { Indexes } from 'components/models/ui/user';
import Empty from 'components/visual/Empty';
import SearchBar from 'components/visual/SearchBar/search-bar';
import { DEFAULT_SUGGESTION } from 'components/visual/SearchBar/search-textfield';
import SimpleSearchQuery from 'components/visual/SearchBar/simple-search-query';
import SearchPager from 'components/visual/SearchPager';
import AlertsTable from 'components/visual/SearchResult/alerts';
import FilesTable from 'components/visual/SearchResult/files';
import ResultsTable from 'components/visual/SearchResult/results';
import RetrohuntTable from 'components/visual/SearchResult/retrohunt';
import SignaturesTable from 'components/visual/SearchResult/signatures';
import SubmissionsTable from 'components/visual/SearchResult/submissions';
import SearchResultCount from 'components/visual/SearchResultCount';
import { searchResultsDisplay } from 'helpers/utils';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Link, useLocation, useParams } from 'react-router-dom';
import ForbiddenPage from './403';

const PAGE_SIZE = 25;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tweaked_tabs: {
      minHeight: 'unset',
      [theme.breakpoints.up('md')]: {
        '& [role=tab]': {
          padding: '8px 20px',
          fontSize: '13px',
          minHeight: 'unset',
          minWidth: 'unset'
        }
      },
      [theme.breakpoints.down('sm')]: {
        minHeight: 'unset',
        '& [role=tab]': {
          fontSize: '12px',
          minHeight: 'unset',
          minWidth: 'unset'
        }
      }
    },
    searchresult: {
      paddingLeft: theme.spacing(1),
      color: theme.palette.primary.main,
      fontStyle: 'italic'
    }
  })
);

type SearchIndexes = Pick<Indexes, 'submission' | 'file' | 'result' | 'signature' | 'alert' | 'retrohunt'>;

type Props = {
  index?: string | null;
};

type Params = {
  id: string;
};

function Search({ index = null }: Props) {
  const { id } = useParams<Params>();
  const { t } = useTranslation(['search']);
  const [pageSize] = useState<number>(PAGE_SIZE);
  const [searching, setSearching] = useState<boolean>(false);
  const { indexes, user: currentUser, configuration } = useALContext();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const classes = useStyles();
  const { apiCall } = useMyAPI();
  const [query, setQuery] = useState<SimpleSearchQuery>(null);
  const [searchSuggestion, setSearchSuggestion] = useState<string[]>(null);
  const [tab, setTab] = useState(null);
  const { showErrorMessage } = useMySnackbar();
  const downSM = useMediaQuery(theme.breakpoints.down('md'));

  // Result lists
  const [submissionResults, setSubmissionResults] = useState<SearchResult<SubmissionIndexed>>(null);
  const [fileResults, setFileResults] = useState<SearchResult<FileIndexed>>(null);
  const [resultResults, setResultResults] = useState<SearchResult<ResultIndexed>>(null);
  const [signatureResults, setSignatureResults] = useState<SearchResult<SignatureIndexed>>(null);
  const [alertResults, setAlertResults] = useState<SearchResult<AlertIndexed>>(null);
  const [retrohuntResults, setRetrohuntResults] = useState<SearchResult<RetrohuntIndexed>>(null);

  // Current index
  const currentIndex = index || id;

  const stateMap = useMemo<Record<keyof SearchIndexes, Dispatch<SetStateAction<SearchResult<unknown>>>>>(
    () => ({
      submission: setSubmissionResults,
      file: setFileResults,
      result: setResultResults,
      signature: setSignatureResults,
      alert: setAlertResults,
      retrohunt: setRetrohuntResults
    }),
    []
  );

  const resMap = useMemo<Record<keyof SearchIndexes, SearchResult<unknown>>>(
    () => ({
      submission: submissionResults,
      file: fileResults,
      result: resultResults,
      signature: signatureResults,
      alert: alertResults,
      retrohunt: retrohuntResults
    }),
    [alertResults, fileResults, resultResults, retrohuntResults, signatureResults, submissionResults]
  );

  const permissionMap = useMemo<Record<keyof SearchIndexes, Role>>(
    () => ({
      submission: 'submission_view',
      file: 'submission_view',
      result: 'submission_view',
      signature: 'signature_view',
      alert: 'alert_view',
      retrohunt: 'retrohunt_view'
    }),
    []
  );

  const queryValue = useRef<string>('');

  const handleChangeTab = useCallback(
    (event, newTab) => {
      navigate(`${location.pathname}?${query.toString()}#${newTab}`);
    },
    [location.pathname, navigate, query]
  );

  const onClear = useCallback(() => {
    query.delete('query');
    navigate(`${location.pathname}?${query.toString()}${location.hash}`);
  }, [location.hash, location.pathname, navigate, query]);

  const onSearch = useCallback(() => {
    if (queryValue.current !== '') {
      query.set('query', queryValue.current);
      navigate(`${location.pathname}?${query.toString()}${location.hash}`);
    } else {
      onClear();
    }
  }, [location.hash, location.pathname, navigate, onClear, query]);

  const onFilterValueChange = useCallback((inputValue: string) => {
    queryValue.current = inputValue;
  }, []);

  const resetResults = useCallback(() => {
    setAlertResults(null);
    setFileResults(null);
    setResultResults(null);
    setRetrohuntResults(null);
    setSignatureResults(null);
    setSubmissionResults(null);
  }, []);

  useEffect(() => {
    // On index change we need to update the search suggestion
    let indexFields: string[] = [];
    if (index || id) {
      // Retrieve the fields specific to the index of interest
      indexFields = Object.keys(indexes[index || id] || {}).filter(name => indexes[index || id][name].indexed);
    } else {
      // Retrieve all fields across indices
      Object.keys(permissionMap)
        // Ensure the user has permission to access those indices
        .filter(searchableIndex => currentUser.roles.includes(permissionMap[searchableIndex]))
        .forEach(searchableIndex => {
          indexFields.push(
            ...Object.keys(indexes[searchableIndex] || {}).filter(name => indexes[searchableIndex][name].indexed)
          );
        });
      // De-dup fields shared across indices and re-sort them
      indexFields = Array.from(new Set<string>(indexFields)).sort();
    }
    setSearchSuggestion([...indexFields, ...DEFAULT_SUGGESTION]);
  }, [index, id, indexes, permissionMap, currentUser.roles]);

  useEffect(() => {
    // On location.search change we need to change the query object and reset the results
    setQuery(new SimpleSearchQuery(location.search, `rows=${pageSize}&offset=0&filters=NOT%20to_be_deleted:true`));
    resetResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, pageSize]);

  useEffect(() => {
    const nextAvailableTab = () => {
      for (const curTab of [...Object.keys(stateMap)]) {
        if (currentUser.roles.includes(permissionMap[curTab])) return curTab;
      }
      return 'submission';
    };
    // On location.hash change, we need to change the tab
    const newTab = location.hash.substring(1, location.hash.length) || index || id || nextAvailableTab();
    setTab(newTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, index, location.hash]);

  useEffect(() => {
    if (query) {
      queryValue.current = query.get('query', '');
      if (query.get('query')) {
        const searchList = [];
        if (!currentIndex) {
          searchList.push(...Object.keys(stateMap));
        } else {
          searchList.push(tab);
          if (!searching) setSearching(true);
        }
        for (const searchIndex of searchList) {
          // Do no perform search if user has no rights
          if (
            !currentUser.roles.includes(permissionMap[searchIndex]) ||
            (searchIndex === 'retrohunt' && !configuration.retrohunt.enabled)
          )
            continue;

          apiCall({
            method: 'POST',
            url: `/api/v4/search/${searchIndex}/`,
            body: { ...query.getParams(), rows: pageSize, offset: 0 },
            onSuccess: api_data => {
              stateMap[searchIndex](api_data.api_response);
            },
            onFailure: api_data => {
              if (index || id || !api_data.api_error_message.includes('Rewrite first')) {
                showErrorMessage(api_data.api_error_message);
              } else {
                stateMap[searchIndex]({ total: 0, offset: 0, items: [], rows: pageSize });
              }
            },
            onFinalize: () => {
              if (currentIndex) {
                setSearching(false);
              }
            }
          });
        }
      }
    }
    // eslint-disable-next-line
  }, [query]);

  const TabSpacer = useCallback(props => <div style={{ flexGrow: 1 }} />, []);

  const SpecialTab = useCallback(({ children, ...otherProps }) => children, []);

  return (currentIndex && !currentUser.roles.includes(permissionMap[index || id])) ||
    (!currentIndex && Object.values(permissionMap).every(val => !currentUser.roles.includes(val))) ||
    (currentIndex === 'retrohunt' && !configuration.retrohunt.enabled) ? (
    <ForbiddenPage />
  ) : (
    <PageFullWidth margin={4}>
      <div style={{ paddingBottom: theme.spacing(2), textAlign: 'left', width: '100%' }}>
        <Typography variant="h4">{t(`title_${index || id || 'all'}`)}</Typography>
      </div>
      <PageHeader isSticky>
        <div style={{ paddingTop: theme.spacing(1) }}>
          <SearchBar
            initValue={query ? query.get('query', '') : ''}
            searching={searching}
            placeholder={t(`search_${index || id || 'all'}`)}
            suggestions={searchSuggestion}
            onValueChange={onFilterValueChange}
            onClear={onClear}
            onSearch={onSearch}
            buttons={
              configuration.datastore.archive.enabled &&
              currentUser.roles.includes('archive_view') &&
              ['submission', 'result', 'file', 'all'].includes(index || id || 'all')
                ? [
                    {
                      icon:
                        query && query.get('use_archive') === 'true' ? (
                          <ArchiveIcon fontSize={downSM ? 'small' : 'medium'} />
                        ) : (
                          <ArchiveOutlinedIcon fontSize={downSM ? 'small' : 'medium'} />
                        ),
                      tooltip:
                        query && query.get('use_archive') === 'true'
                          ? t('use_archive.turn_off')
                          : t('use_archive.turn_on'),
                      props: {
                        onClick: () => {
                          query.set(
                            'use_archive',
                            !query.has('use_archive') ? 'true' : query.get('use_archive') === 'false'
                          );
                          navigate(`${location.pathname}?${query.getDeltaString()}${location.hash}`);
                        }
                      }
                    }
                  ]
                : []
            }
          />

          {!currentIndex && query && query.get('query') && (
            <Paper square style={{ marginBottom: theme.spacing(0.5) }}>
              <Tabs
                className={classes.tweaked_tabs}
                value={tab}
                onChange={handleChangeTab}
                indicatorColor="primary"
                textColor="primary"
                scrollButtons="auto"
                variant="scrollable"
              >
                {currentUser.roles.includes(permissionMap.submission) ? (
                  <Tab
                    label={`${t('submission')} (${
                      submissionResults ? searchResultsDisplay(submissionResults.total) : '...'
                    })`}
                    value="submission"
                  />
                ) : (
                  <Empty />
                )}
                {currentUser.roles.includes(permissionMap.file) ? (
                  <Tab
                    label={`${t('file')} (${fileResults ? searchResultsDisplay(fileResults.total) : '...'})`}
                    value="file"
                  />
                ) : (
                  <Empty />
                )}
                {currentUser.roles.includes(permissionMap.result) ? (
                  <Tab
                    label={`${t('result')} (${resultResults ? searchResultsDisplay(resultResults.total) : '...'})`}
                    value="result"
                  />
                ) : (
                  <Empty />
                )}
                {currentUser.roles.includes(permissionMap.signature) ? (
                  <Tab
                    label={`${t('signature')} (${
                      signatureResults ? searchResultsDisplay(signatureResults.total) : '...'
                    })`}
                    value="signature"
                  />
                ) : (
                  <Empty />
                )}
                {currentUser.roles.includes(permissionMap.alert) ? (
                  <Tab
                    label={`${t('alert')} (${alertResults ? searchResultsDisplay(alertResults.total) : '...'})`}
                    value="alert"
                  />
                ) : (
                  <Empty />
                )}
                {currentUser.roles.includes(permissionMap.retrohunt) && configuration.retrohunt.enabled ? (
                  <Tab
                    label={`${t('retrohunt')} (${
                      retrohuntResults ? searchResultsDisplay(retrohuntResults.total) : '...'
                    })`}
                    value="retrohunt"
                  />
                ) : (
                  <Empty />
                )}
                <TabSpacer />
                <SpecialTab>
                  <Tooltip title={t('focus_search')}>
                    <IconButton
                      size={downSM ? 'small' : 'medium'}
                      component={Link}
                      to={`/search/${tab}${location.search}`}
                    >
                      <CenterFocusStrongOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </SpecialTab>
              </Tabs>
            </Paper>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: theme.spacing(0.5),
              justifyContent: 'flex-end'
            }}
          >
            {resMap[tab] && resMap[tab].total !== 0 && currentIndex && (
              <div className={classes.searchresult}>
                <SearchResultCount count={resMap[tab].total} />
                {t(resMap[tab].total === 1 ? 'matching_result' : 'matching_results')}
              </div>
            )}
            <div style={{ flexGrow: 1 }} />
            {resMap[tab] && (
              <SearchPager
                total={resMap[tab].total}
                setResults={stateMap[tab]}
                page={resMap[tab].offset / resMap[tab].rows + 1}
                pageSize={pageSize}
                index={tab}
                query={query}
                setSearching={setSearching}
              />
            )}
          </div>
        </div>
      </PageHeader>
      <div style={{ paddingTop: theme.spacing(2), paddingLeft: theme.spacing(0.5), paddingRight: theme.spacing(0.5) }}>
        {tab === 'alert' && query && query.get('query') && (
          <AlertsTable alertResults={alertResults} allowSort={!!currentIndex} />
        )}
        {tab === 'file' && query && query.get('query') && (
          <FilesTable fileResults={fileResults} allowSort={!!currentIndex} />
        )}
        {tab === 'result' && query && query.get('query') && (
          <ResultsTable resultResults={resultResults} allowSort={!!currentIndex} />
        )}
        {tab === 'retrohunt' && query && query.get('query') && (
          <RetrohuntTable retrohuntResults={retrohuntResults} allowSort={!!currentIndex} />
        )}
        {tab === 'signature' && query && query.get('query') && (
          <SignaturesTable signatureResults={signatureResults} allowSort={!!currentIndex} />
        )}
        {tab === 'submission' && query && query.get('query') && (
          <SubmissionsTable submissionResults={submissionResults} allowSort={!!currentIndex} />
        )}
      </div>
    </PageFullWidth>
  );
}

export default Search;
