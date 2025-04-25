import type { SelectChangeEvent } from '@mui/material';
import type { StoreProps } from 'components/visual/HexViewer';
import { getItems, getType, getValue, SelectField, useStore } from 'components/visual/HexViewer';
import { default as React } from 'react';
import { useTranslation } from 'react-i18next';

export const WrappedCopyTypeSetting = ({ store }: StoreProps) => {
  const { t } = useTranslation(['hexViewer']);
  const { update } = useStore();

  return (
    <>
      <SelectField
        label={t('copy.nonPrintable.mode.label')}
        description={t('copy.nonPrintable.mode.description')}
        value={getValue.copy.nonPrintable.mode(store.setting.copy.nonPrintable.mode)}
        items={getItems.copy.nonPrintable.mode(store)}
        onChange={(event: SelectChangeEvent<number>, child: React.ReactNode) =>
          update.store.setting.copy.nonPrintable.setMode(getType.copy.nonPrintable.mode(event.target.value as number))
        }
      />
    </>
  );
};

export const CopyTypeSetting = React.memo(
  WrappedCopyTypeSetting,
  (prevProps: Readonly<StoreProps>, nextProps: Readonly<StoreProps>) =>
    prevProps.store.setting.copy.nonPrintable.mode === nextProps.store.setting.copy.nonPrintable.mode &&
    prevProps.store.setting.copy.nonPrintable.prefix === nextProps.store.setting.copy.nonPrintable.prefix &&
    prevProps.store.mode.language === nextProps.store.mode.language
);
