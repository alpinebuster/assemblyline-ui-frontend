import { useTheme } from '@mui/material';
import clsx from 'clsx';
import type { CellType, StoreProps } from 'components/visual/HexViewer';
import { getCellClasses, getHexValue, getTextValue, LAYOUT_SIZE, useDispatch } from 'components/visual/HexViewer';
import type { CSSProperties } from 'react';
import React from 'react';

export type HexCellProps = StoreProps & {
  columnIndex?: number;
  index?: number;
  Tag?: 'div' | 'td';
  type?: CellType;
  style?: CSSProperties;
};

export const WrappedHexCell = ({
  store,
  columnIndex = -1,
  index = -1,
  Tag = 'div',
  type = 'hex',
  style = null
}: HexCellProps) => {
  const theme = useTheme();
  const { onCellMouseEnter, onCellMouseDown } = useDispatch();

  const { codes: hexcodes } = store.hex;

  return (
    <Tag
      id={Tag + '-' + index}
      data-index={index}
      data-theme={theme.palette.mode}
      className={clsx('cell', getCellClasses(store, type, columnIndex, index))}
      onMouseEnter={() => onCellMouseEnter({ index, type })}
      onMouseDown={event => onCellMouseDown({ index, type }, { event })}
      style={{
        width: type === 'hex' ? LAYOUT_SIZE.hexWidth : LAYOUT_SIZE.textWidth,
        paddingLeft: theme.spacing(0.2),
        paddingRight: theme.spacing(0.2),
        fontWeight: theme.palette.mode === 'dark' ? 400 : 600,
        userSelect: 'none',
        ...(Tag === 'div' && { display: 'block' }),
        ...style
      }}
    >
      {type === 'hex' ? getHexValue(hexcodes, index) : getTextValue(store, hexcodes, index)}
    </Tag>
  );
};

export const HexCell = React.memo(
  WrappedHexCell,
  (
    prevProps: Readonly<React.PropsWithChildren<HexCellProps>>,
    nextProps: Readonly<React.PropsWithChildren<HexCellProps>>
  ) =>
    prevProps.index === nextProps.index &&
    prevProps.columnIndex === nextProps.columnIndex &&
    prevProps.store.loading.status === nextProps.store.loading.status &&
    prevProps.store.layout.column.auto === nextProps.store.layout.column.auto &&
    prevProps.store.layout.column.size === nextProps.store.layout.column.size &&
    prevProps.store.mode.body === nextProps.store.mode.body &&
    prevProps.store.mode.theme === nextProps.store.mode.theme &&
    prevProps.store.mode.language === nextProps.store.mode.language &&
    prevProps.store.mode.width === nextProps.store.mode.width &&
    prevProps.store.hex.null.char === nextProps.store.hex.null.char &&
    prevProps.store.hex.nonPrintable.set === nextProps.store.hex.nonPrintable.set &&
    prevProps.store.hex.nonPrintable.char === nextProps.store.hex.nonPrintable.char &&
    prevProps.store.hex.higher.set === nextProps.store.hex.higher.set &&
    prevProps.store.hex.higher.char === nextProps.store.hex.higher.char &&
    prevProps.store.layout.folding.active === nextProps.store.layout.folding.active &&
    prevProps.store.layout.folding.rows.size === nextProps.store.layout.folding.rows.size
);
