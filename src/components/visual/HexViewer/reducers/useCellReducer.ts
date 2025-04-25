import { useCallback } from 'react';
import type { ReducerHandler, Reducers, UseReducer } from '..';
import { isAction } from '..';

export const useCellReducer: UseReducer = () => {
  const cellMouseEnter: Reducers['cellMouseEnter'] = useCallback((store, { type, index }) => {
    return { ...store, cell: { ...store.cell, mouseOverType: type, mouseLeaveIndex: index, mouseEnterIndex: index } };
  }, []);

  const cellMouseDown: Reducers['cellMouseDown'] = useCallback((store, { type, index }) => {
    return { ...store, cell: { ...store.cell, isMouseDown: true, mouseDownIndex: index } };
  }, []);

  const bodyMouseLeave: Reducers['bodyMouseLeave'] = useCallback((store, payload) => {
    return { ...store, cell: { ...store.cell, mouseLeaveIndex: store.cell.mouseEnterIndex, mouseEnterIndex: null } };
  }, []);

  const bodyMouseUp: Reducers['bodyMouseUp'] = useCallback((store, payload) => {
    return { ...store, cell: { ...store.cell, isMouseDown: false } };
  }, []);

  const appClickAway: Reducers['appClickAway'] = useCallback((store, payload) => {
    return {
      ...store,
      cell: {
        ...store.cell,
        mouseEnterIndex: null,
        mouseLeaveIndex: null,
        mouseDownIndex: null,
        mouseUpIndex: null,
        isMouseDown: false
      }
    };
  }, []);

  const reducer: ReducerHandler = useCallback(
    ({ store, action: { type, payload } }) => {
      if (isAction.cellMouseEnter(type)) return cellMouseEnter(store, payload);
      else if (isAction.cellMouseDown(type)) return cellMouseDown(store, payload);
      else if (isAction.bodyMouseLeave(type)) return bodyMouseLeave(store, payload);
      else if (isAction.bodyMouseUp(type)) return bodyMouseUp(store, payload);
      else if (isAction.appClickAway(type)) return appClickAway(store, payload);
      else return { ...store };
    },
    [appClickAway, bodyMouseLeave, bodyMouseUp, cellMouseDown, cellMouseEnter]
  );

  return { reducer };
};
