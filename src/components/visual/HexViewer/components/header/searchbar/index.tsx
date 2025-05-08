import type { StoreProps } from 'components/visual/HexViewer';
import { HexcodeBar, HexCursorBar, TextBar } from 'components/visual/HexViewer';
import { memo } from 'react';

export * from './cursorbar';
export * from './hexcodebar';
export * from './textbar';

const WrappedHexSearchBar = ({ store }: StoreProps) => {
  if (store.search.mode.type === 'cursor') return <HexCursorBar store={store} />;
  else if (store.search.mode.type === 'hex') return <HexcodeBar store={store} />;
  else if (store.search.mode.type === 'text') return <TextBar store={store} />;
  else return <></>;
};

export const HexSearchBar = memo(WrappedHexSearchBar);
