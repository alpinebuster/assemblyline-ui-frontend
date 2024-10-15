import { AlertTitle, Skeleton, Tooltip } from '@mui/material';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import useALContext from 'components/hooks/useALContext';
import type { Safelist } from 'components/models/base/safelist';
import type { SearchResult } from 'components/models/ui/search';
import Classification from 'components/visual/Classification';
import CustomChip from 'components/visual/CustomChip';
import {
  DivTable,
  DivTableBody,
  DivTableCell,
  DivTableHead,
  DivTableRow,
  LinkRow,
  SortableHeaderCell
} from 'components/visual/DivTable';
import InformativeAlert from 'components/visual/InformativeAlert';
import Moment from 'components/visual/Moment';
import { maxLenStr } from 'helpers/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type Props = {
  safelistResults: SearchResult<Safelist>;
  setSafelistID?: (id: string) => void;
  allowSort?: boolean;
};

const WrappedSafelistTable: React.FC<Props> = ({ safelistResults, setSafelistID = null, allowSort = true }) => {
  const { t, i18n } = useTranslation(['search']);
  const { c12nDef } = useALContext();

  return safelistResults ? (
    safelistResults.total !== 0 ? (
      <TableContainer component={Paper}>
        <DivTable>
          <DivTableHead>
            <DivTableRow>
              <SortableHeaderCell sortField="added" allowSort={allowSort}>
                {t('header.added')}
              </SortableHeaderCell>
              <SortableHeaderCell sortField="type" allowSort={allowSort}>
                {t('header.type')}
              </SortableHeaderCell>
              <DivTableCell>{t('header.identifier')}</DivTableCell>
              <SortableHeaderCell sortField="sources.name" allowSort={allowSort}>
                {t('header.source')}
              </SortableHeaderCell>
              {c12nDef.enforce && (
                <SortableHeaderCell sortField="classification" allowSort={allowSort}>
                  {t('header.classification')}
                </SortableHeaderCell>
              )}
              <SortableHeaderCell sortField="enabled" allowSort={allowSort}>
                {t('header.status')}
              </SortableHeaderCell>
            </DivTableRow>
          </DivTableHead>
          <DivTableBody>
            {safelistResults.items.map(sl_item => (
              <LinkRow
                key={sl_item.id}
                component={Link}
                to={`/manage/safelist/${sl_item.id}`}
                onClick={event => {
                  if (setSafelistID) {
                    event.preventDefault();
                    setSafelistID(sl_item.id);
                  }
                }}
                hover
              >
                <DivTableCell>
                  <Tooltip title={sl_item.added}>
                    <div>
                      <Moment variant="fromNow">{sl_item.added}</Moment>
                    </div>
                  </Tooltip>
                </DivTableCell>
                <DivTableCell>{sl_item.type}</DivTableCell>
                <DivTableCell breakable>
                  {sl_item.type === 'file'
                    ? sl_item.id
                    : sl_item.type === 'signature'
                    ? maxLenStr(sl_item.signature.name, 100)
                    : `${sl_item.tag.type} - ${maxLenStr(sl_item.tag.value, 100)}`}
                </DivTableCell>
                <DivTableCell breakable>{sl_item.sources.map(obj => obj.name).join(' | ')}</DivTableCell>
                {c12nDef.enforce && (
                  <DivTableCell>
                    <Classification type="text" size="tiny" c12n={sl_item.classification} format="short" />
                  </DivTableCell>
                )}
                <DivTableCell>
                  <CustomChip
                    fullWidth
                    type="rounded"
                    variant="outlined"
                    size="small"
                    color={sl_item.enabled ? 'primary' : 'default'}
                    label={sl_item.enabled ? t('enabled') : t('disabled')}
                  />
                </DivTableCell>
              </LinkRow>
            ))}
          </DivTableBody>
        </DivTable>
      </TableContainer>
    ) : (
      <div style={{ width: '100%' }}>
        <InformativeAlert>
          <AlertTitle>{t('no_safelist_title')}</AlertTitle>
          {t('no_results_desc')}
        </InformativeAlert>
      </div>
    )
  ) : (
    <Skeleton variant="rectangular" style={{ height: '6rem', borderRadius: '4px' }} />
  );
};

const SafelistTable = React.memo(WrappedSafelistTable);
export default SafelistTable;
