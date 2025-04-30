import { useEffectOnce } from 'commons/components/utils/hooks/useEffectOnce';
import React, { useCallback, useRef, useState } from 'react';

export const useTrottledReducer = <State, Action>(
  reducer: (state: Partial<State>, action: Action) => State,
  initialState: State,
  delay: number = 1000
): [State, (action: Action) => void, React.MutableRefObject<State>] => {
  // const [state, dispatch] = React.useReducer<React.Reducer<Partial<State>, { type: string; payload: any }>>(
  //   reducer,
  //   initialState
  // );
  const [state, setState] = useState<State>(initialState);
  const prevStateRef = useRef<State>(initialState);
  const nextStateRef = useRef<State>(initialState);
  const dispatchRef = useRef(setState);
  const timeout = useRef(null);

  useEffectOnce(() => {
    dispatchRef.current = setState;
  });

  const clear = useCallback(() => {
    clearTimeout(timeout.current);
    timeout.current = null;
  }, []);

  const reset = useCallback(() => {
    timeout.current = setTimeout(() => {
      if (!Object.is(prevStateRef.current, nextStateRef.current)) {
        prevStateRef.current = nextStateRef.current;
        setState(prevStateRef.current);
        clear();
        reset();
      } else clear();
    }, delay);
  }, [clear, delay]);

  const dispatchCallback = useCallback(
    (action: Action) => {
      nextStateRef.current = reducer(nextStateRef.current, action);

      if (timeout.current === null) {
        prevStateRef.current = nextStateRef.current;
        setState(prevStateRef.current);
        reset();
      }
    },
    [reducer, reset]
  );

  return [state, dispatchCallback, nextStateRef];
};

export default useTrottledReducer;
