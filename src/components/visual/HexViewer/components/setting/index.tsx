import { Button, Grid } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import makeStyles from '@mui/styles/makeStyles';
import { default as React } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CopyTypeSetting,
  HexColumnSetting,
  HexOffsetBaseSetting,
  HexSearchModeEncodingSetting,
  HexSearchModeTextSpanSetting,
  HexSetSetting,
  RowFoldingSetting,
  StoreProps,
  useDispatch
} from '../..';

export * from './bodyType';
export * from './column';
export * from './copyType';
export * from './hexEncoding';
export * from './hexSet';
export * from './offsetBase';
export * from './OutlinedField';
export * from './rowFolding';
export * from './searchModeEncoding';
export * from './searchModeTextSpan';

const useHexStyles = makeStyles(theme => ({
  dialog: {},
  spacer: { flex: 1 }
}));

export const WrappedHexSettings = ({ store }: StoreProps) => {
  const { t } = useTranslation(['hexViewer']);
  const classes = useHexStyles();

  const { onSettingSave, onSettingClose, onSettingReset } = useDispatch();

  return (
    <div>
      <Dialog className={classes.dialog} open={store.setting.open} onClose={() => onSettingClose()}>
        <DialogTitle>{t('settings.title')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} alignItems="center">
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={1} alignItems="center">
                {/* <HexBodyTypeSetting store={store} /> */}
                <HexColumnSetting store={store} />
                <RowFoldingSetting store={store} />
                <HexSearchModeEncodingSetting store={store} />
                <HexSearchModeTextSpanSetting store={store} />
                <HexOffsetBaseSetting store={store} />
                <CopyTypeSetting store={store} />
                <HexSetSetting store={store} />
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onSettingReset()} color="primary" autoFocus>
            {t('settings.reset')}
          </Button>
          <div className={classes.spacer} />
          <Button onClick={() => onSettingSave()} color="primary" autoFocus>
            {t('settings.save')}
          </Button>
          <Button onClick={() => onSettingClose()} color="primary">
            {t('settings.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export const HexSettings = React.memo(
  WrappedHexSettings,
  (
    prevProps: Readonly<React.PropsWithChildren<StoreProps>>,
    nextProps: Readonly<React.PropsWithChildren<StoreProps>>
  ) => Object.is(prevProps.store.setting, nextProps.store.setting)
);

export default HexSettings;
