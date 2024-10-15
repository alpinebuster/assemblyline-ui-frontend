import type { Params } from 'components/routes/alerts/utils/SearchParams';
import type { SearchResult } from 'components/routes/alerts/utils/SearchParser';
import { SearchParser } from 'components/routes/alerts/utils/SearchParser';
import { once } from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

type ContextProps<T extends Params> = {
  search: SearchResult<T>;
  setSearchParams: (value: URLSearchParams | ((params: URLSearchParams) => URLSearchParams)) => void;
  setSearchObject: (value: T | ((params: T) => T)) => void;
};

type Props<T extends Params> = {
  children: React.ReactNode;

  /**
   * Default search parameters including null values.
   */
  defaultValue?: T;

  /**
   * Hidden search parameters will not be shown in the URL
   */
  hidden?: (keyof T)[];

  /**
   * Enforced search parameters will always be its default value
   */
  enforced?: (keyof T)[];

  /**
   * modifiers for the multiple search parameters
   */
  prefixes?: {
    /**
     * negated search parameters
     */
    not: string;

    /**
     * ignored search parameters
     */
    ignore: string;
  };
};

const createSearchParamsContext = once(<T extends Params>() => createContext<ContextProps<T>>(null));
export const useSearchParams = <T extends Params>(): ContextProps<T> => useContext(createSearchParamsContext<T>());

export const SearchParamsProvider = <T extends Params>({
  children,
  defaultValue = null,
  hidden = [],
  enforced = [],
  prefixes = null
}: Props<T>) => {
  const SearchParamsContext = createSearchParamsContext<T>();
  const navigate = useNavigate();
  const location = useLocation();

  const [hiddenParams, setHiddenParams] = useState<URLSearchParams>(new URLSearchParams());

  const locationParams = useMemo<URLSearchParams>(() => new URLSearchParams(location.search), [location.search]);

  const parser = useMemo<SearchParser<T>>(
    () => new SearchParser<T>(defaultValue, { enforced, prefixes }),
    [defaultValue, enforced, prefixes]
  );

  const search = useMemo<ContextProps<T>['search']>(
    () => parser.mergeParams(locationParams, hiddenParams, key => !hidden.includes(key)),
    [hidden, hiddenParams, locationParams, parser]
  );

  const prevSearch = useRef<string>(null);
  const prevHidden = useRef<string>(null);
  const searchParamsRef = useRef<URLSearchParams>(search.toParams());
  const searchObjectRef = useRef<T>(search.toObject());

  const handleUpdateRef = useCallback((value: SearchResult<T>) => {
    searchParamsRef.current = value.toParams();
    searchObjectRef.current = value.toObject();
  }, []);

  const handleNavigate = useCallback(
    (value: SearchResult<T>) => {
      const [nextSearch, nextHidden] = value.toSplitParams(key => !hidden.includes(key));

      if (prevHidden.current !== nextHidden.toString()) {
        setHiddenParams(nextHidden);
      }

      if (prevSearch.current !== nextSearch.toString() && window.location.search.slice(1) !== nextSearch.toString()) {
        navigate(`${window.location.pathname}?${nextSearch.toString()}${window.location.hash}`);
      }
    },
    [hidden, navigate]
  );

  const setSearchParams = useCallback<ContextProps<T>['setSearchParams']>(
    input => {
      const values = typeof input === 'function' ? input(searchParamsRef.current) : input;
      handleUpdateRef(parser.fromParams(values));
      handleNavigate(parser.deltaParams(values));
    },
    [handleNavigate, handleUpdateRef, parser]
  );

  const setSearchObject = useCallback<ContextProps<T>['setSearchObject']>(
    input => {
      const values = typeof input === 'function' ? input(searchObjectRef.current) : input;
      handleUpdateRef(parser.fromObject(values));
      handleNavigate(parser.deltaObject(values));
    },
    [handleNavigate, handleUpdateRef, parser]
  );

  useEffect(() => {
    handleUpdateRef(search);
  }, [handleUpdateRef, search]);

  useEffect(() => {
    prevSearch.current = search.toString();
  }, [search]);

  useEffect(() => {
    prevHidden.current = hiddenParams.toString();
  }, [hiddenParams]);

  return (
    <SearchParamsContext.Provider value={{ search, setSearchParams, setSearchObject }}>
      {!search ? null : children}
    </SearchParamsContext.Provider>
  );
};
