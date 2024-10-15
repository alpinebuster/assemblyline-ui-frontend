import useAppUser from 'commons/components/app/hooks/useAppUser';
import useALContext from 'components/hooks/useALContext';
import useMyAPI from 'components/hooks/useMyAPI';
import type { CustomUser } from 'components/models/ui/user';
import type { Favorite } from 'components/routes/alerts/components/Favorites';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ContextProps = {
  userFavorites: Favorite[];
  globalFavorites: Favorite[];
  defaultFavorite: Favorite;
  updateFavorite: (favorite: Favorite, global: boolean) => void;
  deleteFavorite: (favorite: Favorite, global: boolean) => void;
};

type Props = {
  children: React.ReactNode;
};

const AlertsContext = createContext<ContextProps>(null);

export const useAlerts = (): ContextProps => useContext(AlertsContext);

export const AlertsProvider = ({ children }: Props) => {
  const { apiCall } = useMyAPI();
  const { c12nDef } = useALContext();
  const { user: currentUser } = useAppUser<CustomUser>();

  const defaultFavorite = useMemo<Favorite>(
    () => ({ classification: c12nDef.UNRESTRICTED, name: '', query: '', created_by: currentUser.username }),
    [c12nDef.UNRESTRICTED, currentUser.username]
  );

  const [userFavorites, setUserFavorites] = useState<Favorite[]>([]);
  const [globalFavorites, setGlobalFavorites] = useState<Favorite[]>([]);

  const updateFavorite = useCallback((favorite: Favorite, global: boolean) => {
    const update = (values: Favorite[]) => {
      const index = values.findIndex(value => value.name === favorite.name);
      return index >= 0
        ? [...values.slice(0, index), favorite, ...values.slice(index + 1, values.length)]
        : [...values, favorite];
    };
    global ? setGlobalFavorites(update) : setUserFavorites(update);
  }, []);

  const deleteFavorite = useCallback((favorite: Favorite, global: boolean) => {
    const toSpliced = (values: Favorite[]) => {
      const index = values.findIndex(value => value.name === favorite.name);
      if (index >= 0) values.splice(index, 1);
      return values;
    };
    global ? setGlobalFavorites(toSpliced) : setUserFavorites(toSpliced);
  }, []);

  useEffect(() => {
    apiCall({
      url: `/api/v4/user/favorites/${currentUser.username}/`,
      onSuccess: ({ api_response }) => setUserFavorites(api_response.alert)
    });

    return () => {
      setUserFavorites([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.username]);

  useEffect(() => {
    apiCall({
      url: '/api/v4/user/favorites/__global__/',
      onSuccess: ({ api_response }) => setGlobalFavorites(api_response.alert)
    });

    return () => {
      setGlobalFavorites([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AlertsContext.Provider
      value={{
        userFavorites,
        globalFavorites,
        defaultFavorite,
        updateFavorite,
        deleteFavorite
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};
