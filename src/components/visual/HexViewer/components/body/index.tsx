import type { StoreProps } from 'components/visual/HexViewer';
import {
  HexRow,
  HexScrollBar,
  LAYOUT_SIZE,
  scrollToWindowIndexAsync,
  useDispatch,
  useEventListener,
  useStore,
  WindowRow
} from 'components/visual/HexViewer';
import type { KeyboardEvent, PropsWithChildren } from 'react';
import React, { memo, useMemo, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { FixedSizeListProps, ListOnItemsRenderedProps } from 'react-window';
import { FixedSizeList } from 'react-window';

const List = FixedSizeList as unknown as React.FC<FixedSizeListProps<unknown> & { ref: unknown }>;

export * from './cell';
export * from './offset';
export * from './row';
export * from './scrollbar';
export * from './spacer';

const HexTableBody = memo(({ store }: StoreProps) => {
  const {
    onBodyInit,
    onBodyResize,
    onBodyMouseLeave,
    onBodyScrollWheel,
    onCursorKeyDown,
    onCopyKeyDown,
    onBodyMouseUp,
    onScrollTouchStart,
    onScrollTouchMove,
    onBodyRefInit,
    onBodyScrollInit,
    onScrollTouchEnd
  } = useDispatch();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEventListener('resize', () => onBodyResize(bodyRef?.current?.getBoundingClientRect()));
  useEventListener('keydown', (event: KeyboardEvent) => onCursorKeyDown({ event }, { store }));
  useEventListener('keydown', (event: KeyboardEvent) => onCopyKeyDown(undefined, { event, store }));
  useEventListener('mouseup', (event: MouseEvent) => onBodyMouseUp(undefined, { store, event }));

  React.useLayoutEffect(() => {
    if (bodyRef.current !== null && store.loading.conditions.hasBodyRefInit === false) onBodyRefInit({ ready: true });
    else if (bodyRef.current === null && store.loading.conditions.hasBodyRefInit === true)
      onBodyRefInit({ ready: false });
  }, [store, onBodyInit, onBodyRefInit]);

  React.useEffect(() => {
    if (store.loading.conditions.hasBodyRefInit) onBodyResize(bodyRef.current.getBoundingClientRect());
  }, [onBodyResize, store.loading.conditions.hasBodyRefInit]);

  React.useEffect(() => {
    if (store.loading.conditions.hasResized && !store.loading.conditions.hasScrolled) onBodyScrollInit();
  }, [onBodyScrollInit, store.loading.conditions.hasResized, store.loading.conditions.hasScrolled]);

  React.useEffect(() => {
    if (store.loading.conditions.hasScrolled) onBodyInit({ initialized: true });
  }, [onBodyInit, store.loading.conditions.hasScrolled]);

  const rowIndexes: number[] = useMemo(
    () => Array.from(Array(store.layout.row.size).keys()).map(i => i + store.scroll.rowIndex),
    [store.layout.row.size, store.scroll.rowIndex]
  );

  return (
    <div
      ref={bodyRef}
      className="hex-viewer-root"
      onWheel={(event: React.WheelEvent<HTMLDivElement>) => onBodyScrollWheel({ event })}
      onMouseLeave={() => onBodyMouseLeave()}
      onTouchStart={(event: React.TouchEvent<HTMLDivElement>) => onScrollTouchStart({ event })}
      onTouchMove={(event: React.TouchEvent<HTMLDivElement>) => onScrollTouchMove({ event })}
      onTouchEnd={() => onScrollTouchEnd()}
    >
      {store.loading.status === 'initialized' ? (
        <>
          <div style={{ flex: 1 }} />
          <table style={{ padding: '0px', margin: '0px', borderSpacing: '0px' }}>
            <tbody style={{ padding: '0px', margin: '0px' }}>
              {rowIndexes.map(rowIndex => (
                <HexRow key={rowIndex} store={store} rowIndex={rowIndex} Tag="tr" />
              ))}
            </tbody>
          </table>
          <div style={{ flex: 1 }} />
          <HexScrollBar store={store} />
        </>
      ) : (
        <></>
      )}
    </div>
  );
});

const HexWindowBody = memo(({ store }: StoreProps) => {
  const {
    onBodyInit,
    onBodyRefInit,
    onBodyResize,
    onBodyItemsRendered,
    onBodyScrollInit,
    onCursorKeyDown,
    onCopyKeyDown,
    onBodyMouseUp,
    onBodyMouseLeave
  } = useDispatch();
  const { dispatch } = useStore();

  const listRef = useRef<FixedSizeListProps<unknown>>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEventListener('keydown', (event: KeyboardEvent) => onCursorKeyDown({ event }, { store }));
  useEventListener('keydown', (event: KeyboardEvent) => onCopyKeyDown(undefined, { event, store }));
  useEventListener('mouseup', (event: MouseEvent) => onBodyMouseUp(undefined, { store, event }));

  React.useLayoutEffect(() => {
    if (listRef.current !== null && bodyRef.current !== null && store.loading.conditions.hasBodyRefInit === false)
      onBodyRefInit({ ready: true });
    else if ((listRef.current === null || bodyRef.current === null) && store.loading.conditions.hasBodyRefInit === true)
      onBodyRefInit({ ready: false });
  }, [store, onBodyInit, onBodyRefInit]);

  React.useEffect(() => {
    if (store.loading.conditions.hasBodyRefInit) onBodyResize(bodyRef.current.getBoundingClientRect());
  }, [onBodyResize, store.loading.conditions.hasBodyRefInit]);

  React.useEffect(() => {
    if (store.loading.conditions.hasResized)
      scrollToWindowIndexAsync(store, listRef, store.scroll.index, store.scroll.type).then(
        () => !store.loading.conditions.hasScrolled && onBodyScrollInit()
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    onBodyScrollInit,
    store.loading.conditions.hasResized,
    store.scroll.index,
    store.scroll.rowIndex,
    store.scroll.type
  ]);

  React.useEffect(() => {
    const _bodyRef = bodyRef.current;
    _bodyRef !== null && _bodyRef.addEventListener('mouseleave', () => onBodyMouseLeave());
    return () => _bodyRef !== null && _bodyRef.removeEventListener('mouseleave', () => onBodyMouseLeave());
  }, [onBodyMouseLeave, store.loading.status]);

  const Row = React.useMemo(
    () =>
      ({ index, style, data }) =>
        store.loading.status === 'initialized' ? (
          <WindowRow key={index} rowIndex={index} style={style} Tag={data.Tag} />
        ) : (
          <></>
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.layout.column.size, store.layout.row.size, store.loading.status]
  );

  const { active, rows } = store.layout.folding;

  return (
    <AutoSizer onResize={({ height, width }: { height: number; width: number }) => onBodyResize({ height, width })}>
      {({ height, width }) => (
        <List
          ref={listRef}
          innerRef={bodyRef}
          className="hex-viewer-root"
          height={height}
          width={width}
          itemSize={LAYOUT_SIZE.rowHeight}
          itemCount={!active ? store.scroll.lastRowIndex : rows.size}
          overscanCount={store.scroll.overscanCount}
          initialScrollOffset={0}
          itemData={{
            Tag: 'div'
          }}
          onItemsRendered={(event: ListOnItemsRenderedProps) => onBodyItemsRendered({ event })}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
});

const HexBodySelector = memo(({ store }: StoreProps) => {
  if (store.mode.body === 'table') return <HexTableBody store={store} />;
  else if (store.mode.body === 'window') return <HexWindowBody store={store} />;
});

export const HexBody = memo(
  ({ store }: StoreProps) => <HexBodySelector store={store} />,
  (prevProps: Readonly<PropsWithChildren<StoreProps>>, nextProps: Readonly<PropsWithChildren<StoreProps>>) =>
    Object.is(prevProps.store.loading, nextProps.store.loading) &&
    prevProps.store.hex.null.char === nextProps.store.hex.null.char &&
    prevProps.store.hex.nonPrintable.set === nextProps.store.hex.nonPrintable.set &&
    prevProps.store.hex.nonPrintable.char === nextProps.store.hex.nonPrintable.char &&
    prevProps.store.hex.higher.set === nextProps.store.hex.higher.set &&
    prevProps.store.hex.higher.char === nextProps.store.hex.higher.char &&
    prevProps.store.offset.base === nextProps.store.offset.base &&
    prevProps.store.offset.size === nextProps.store.offset.size &&
    prevProps.store.layout.row.size === nextProps.store.layout.row.size &&
    prevProps.store.layout.column.size === nextProps.store.layout.column.size &&
    prevProps.store.layout.column.max === nextProps.store.layout.column.max &&
    prevProps.store.layout.row.auto === nextProps.store.layout.row.auto &&
    prevProps.store.layout.row.max === nextProps.store.layout.row.max &&
    prevProps.store.layout.column.auto === nextProps.store.layout.column.auto &&
    prevProps.store.layout.isFocusing === nextProps.store.layout.isFocusing &&
    prevProps.store.loading.status === nextProps.store.loading.status &&
    prevProps.store.mode.theme === nextProps.store.mode.theme &&
    prevProps.store.mode.language === nextProps.store.mode.language &&
    prevProps.store.mode.width === nextProps.store.mode.width &&
    prevProps.store.scroll.index === nextProps.store.scroll.index &&
    prevProps.store.scroll.rowIndex === nextProps.store.scroll.rowIndex &&
    prevProps.store.scroll.maxRowIndex === nextProps.store.scroll.maxRowIndex &&
    prevProps.store.scroll.speed === nextProps.store.scroll.speed &&
    prevProps.store.scroll.type === nextProps.store.scroll.type &&
    prevProps.store.select.isHighlighting === nextProps.store.select.isHighlighting &&
    prevProps.store.layout.folding.active === nextProps.store.layout.folding.active &&
    prevProps.store.layout.folding.rows.size === nextProps.store.layout.folding.rows.size
);

export default HexBody;
