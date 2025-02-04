import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import PageFullWidth from 'commons/components/pages/PageFullWidth';
import PageHeader from 'commons/components/pages/PageHeader';
import type { SearchParams } from 'components/core/SearchParams/SearchParams';
import { createSearchParams } from 'components/core/SearchParams/SearchParams';
import { SearchParamsProvider, useSearchParams } from 'components/core/SearchParams/SearchParamsContext';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import type { SubmissionIndexed } from 'components/models/base/submission';
import SearchHeader from 'components/visual/SearchBar/SearchHeader';
import { DEFAULT_SUGGESTION } from 'components/visual/SearchBar/search-textfield';
import SubmissionsTable from 'components/visual/SearchResult/submissions';
import { safeFieldValue } from 'helpers/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ForbiddenPage from './403';

type SearchResults = {
  items: SubmissionIndexed[];
  offset: number;
  rows: number;
  total: number;
};

const SUBMISSION_PARAMS = createSearchParams(p => ({
  query: p.string(''),
  offset: p.number(0).min(0).hidden().ignored(),
  rows: p.number(25).enforced().hidden().ignored(),
  sort: p.string('times.submitted desc').ignored(),
  filters: p.filters([]),
  track_total_hits: p.number(10000).nullable().ignored()
}));

export type SubmissionParams = SearchParams<typeof SUBMISSION_PARAMS>;

const SubmissionSearch = () => {
  const { t } = useTranslation(['submissions']);
  const theme = useTheme();
  const { apiCall } = useMyAPI();
  const { user: currentUser, indexes } = useALContext();
  const { search, setSearchParams, setSearchObject } = useSearchParams<SubmissionParams>();

  const [submissionResults, setSubmissionResults] = useState<SearchResults>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const suggestions = useMemo<string[]>(
    () => [...Object.keys(indexes.submission).filter(name => indexes.submission[name].indexed), ...DEFAULT_SUGGESTION],
    [indexes.submission]
  );

  const handleToggleFilter = useCallback(
    (filter: string) => {
      setSearchObject(o => {
        const filters = o.filters.includes(filter) ? o.filters.filter(f => f !== filter) : [...o.filters, filter];
        return { ...o, offset: 0, filters };
      });
    },
    [setSearchObject]
  );

  useEffect(() => {
    if (!search || !currentUser.roles.includes('submission_view')) return;

    apiCall({
      url: '/api/v4/search/submission/',
      method: 'POST',
      body: search
        .set(o => ({ ...o, query: o.query || '*', filters: [...o.filters, 'NOT(to_be_deleted:true)'] }))
        .toObject(),
      onSuccess: ({ api_response }) => setSubmissionResults(api_response as SearchResults),
      onEnter: () => setSearching(true),
      onExit: () => setSearching(false)
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.roles, search]);

  return currentUser.roles.includes('submission_view') ? (
    <PageFullWidth margin={4}>
      <div style={{ paddingBottom: theme.spacing(2) }}>
        <Typography variant="h4">{t('title')}</Typography>
      </div>

      <PageHeader isSticky>
        <div style={{ paddingTop: theme.spacing(1) }}>
          <SearchHeader
            params={search.toParams()}
            loading={searching}
            results={submissionResults}
            resultLabel={
              search.get('query')
                ? t(`filtered${submissionResults?.total === 1 ? '' : 's'}`)
                : t(`total${submissionResults?.total === 1 ? '' : 's'}`)
            }
            onChange={v => setSearchParams(v)}
            paramDefaults={search.defaults().toObject()}
            searchInputProps={{ placeholder: t('filter'), options: suggestions }}
            actionProps={[
              {
                tooltip: {
                  title: search.has('filters', `params.submitter:${safeFieldValue(currentUser.username)}`)
                    ? t('filter.personal.remove')
                    : t('filter.personal.add')
                },
                icon: { children: <PersonIcon /> },
                button: {
                  color: search.has('filters', `params.submitter:${safeFieldValue(currentUser.username)}`)
                    ? 'primary'
                    : 'default',
                  onClick: () => handleToggleFilter(`params.submitter:${safeFieldValue(currentUser.username)}`)
                }
              },
              {
                tooltip: {
                  title: search.has('filters', 'state:completed')
                    ? t('filter.completed.remove')
                    : t('filter.completed.add')
                },
                icon: { children: <AssignmentTurnedInIcon /> },
                button: {
                  sx: {
                    color: !search.has('filters', 'state:completed')
                      ? 'default'
                      : theme.palette.mode === 'dark'
                      ? theme.palette.success.light
                      : theme.palette.success.dark
                  },
                  onClick: () => handleToggleFilter('state:completed')
                }
              },
              {
                tooltip: {
                  title: search.has('filters', 'max_score:>=1000')
                    ? t('filter.malicious.remove')
                    : t('filter.malicious.add')
                },
                icon: { children: <BugReportOutlinedIcon /> },
                button: {
                  sx: {
                    color: !search.has('filters', 'max_score:>=1000')
                      ? 'default'
                      : theme.palette.mode === 'dark'
                      ? theme.palette.error.light
                      : theme.palette.error.dark
                  },
                  onClick: () => handleToggleFilter('max_score:>=1000')
                }
              }
            ]}
          />
        </div>
      </PageHeader>

      <div style={{ paddingTop: theme.spacing(2), paddingLeft: theme.spacing(0.5), paddingRight: theme.spacing(0.5) }}>
        <SubmissionsTable submissionResults={submissionResults} />
      </div>
    </PageFullWidth>
  ) : (
    <ForbiddenPage />
  );
};

const WrappedSubmissionPage = () => (
  <SearchParamsProvider params={SUBMISSION_PARAMS}>
    <SubmissionSearch />
  </SearchParamsProvider>
);

export const SubmissionPage = React.memo(WrappedSubmissionPage);
export default SubmissionPage;
