import ClearIcon from '@mui/icons-material/Clear';
import DoneIcon from '@mui/icons-material/Done';
import { AlertTitle, Skeleton } from '@mui/material';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import useALContext from 'components/hooks/useALContext';
import type { WorkflowIndexed } from 'components/models/base/workflow';
import type { SearchResult } from 'components/models/ui/search';
import Classification from 'components/visual/Classification';
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
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type Props = {
  workflowResults: SearchResult<WorkflowIndexed>;
  setWorkflowID?: (id: string) => void;
};

const WrappedWorflowTable: React.FC<Props> = ({ workflowResults, setWorkflowID = null }) => {
  const { t } = useTranslation(['search']);
  const { c12nDef } = useALContext();

  return workflowResults ? (
    workflowResults.total !== 0 ? (
      <TableContainer component={Paper}>
        <DivTable>
          <DivTableHead>
            <DivTableRow>
              <SortableHeaderCell sortField="creation_date">{t('header.created')}</SortableHeaderCell>
              <SortableHeaderCell sortField="last_seen">{t('header.lasttimeseen')}</SortableHeaderCell>
              <SortableHeaderCell sortField="name">{t('header.name')}</SortableHeaderCell>
              <SortableHeaderCell sortField="priority">{t('header.priority')}</SortableHeaderCell>
              <SortableHeaderCell sortField="status">{t('header.status')}</SortableHeaderCell>
              <SortableHeaderCell sortField="hit_count">{t('header.hit_count')}</SortableHeaderCell>
              {c12nDef.enforce && (
                <SortableHeaderCell sortField="classification">{t('header.classification')}</SortableHeaderCell>
              )}
              <SortableHeaderCell sortField="enabled">{t('header.enabled')}</SortableHeaderCell>
            </DivTableRow>
          </DivTableHead>
          <DivTableBody>
            {workflowResults.items.map(workflow => (
              <LinkRow
                key={workflow.workflow_id}
                component={Link}
                to={`/manage/workflow/detail/${workflow.workflow_id}`}
                onClick={event => {
                  if (setWorkflowID) {
                    event.preventDefault();
                    setWorkflowID(workflow.workflow_id);
                  }
                }}
                hover
              >
                <DivTableCell>
                  <Moment variant="fromNow">{workflow.creation_date}</Moment>
                </DivTableCell>
                <DivTableCell>
                  {workflow.last_seen && <Moment variant="fromNow">{workflow.last_seen}</Moment>}
                </DivTableCell>
                <DivTableCell>{workflow.name}</DivTableCell>
                <DivTableCell>{workflow.priority}</DivTableCell>
                <DivTableCell>{workflow.status}</DivTableCell>
                <DivTableCell>{workflow.hit_count}</DivTableCell>
                {c12nDef.enforce && (
                  <DivTableCell>
                    <Classification type="text" size="tiny" c12n={workflow.classification} format="short" />
                  </DivTableCell>
                )}
                <DivTableCell>
                  {workflow && (workflow.enabled || workflow.enabled === undefined) ? (
                    // By default, workflows were always enabled
                    <DoneIcon color="primary" />
                  ) : (
                    <ClearIcon color="error" />
                  )}
                </DivTableCell>
              </LinkRow>
            ))}
          </DivTableBody>
        </DivTable>
      </TableContainer>
    ) : (
      <div style={{ width: '100%' }}>
        <InformativeAlert>
          <AlertTitle>{t('no_workflows_title')}</AlertTitle>
          {t('no_results_desc')}
        </InformativeAlert>
      </div>
    )
  ) : (
    <Skeleton variant="rectangular" style={{ height: '6rem', borderRadius: '4px' }} />
  );
};

const WorflowTable = React.memo(WrappedWorflowTable);
export default WorflowTable;
