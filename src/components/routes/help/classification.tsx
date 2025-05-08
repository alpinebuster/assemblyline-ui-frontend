import { Skeleton, Typography, useTheme } from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import useALContext from 'components/hooks/useALContext';
import NotFoundPage from 'components/routes/404_dl';
import Classification from 'components/visual/Classification';
import { Trans, useTranslation } from 'react-i18next';

export default function HelpClassification() {
  const { t } = useTranslation(['helpClassification']);
  const { c12nDef } = useALContext();
  const theme = useTheme();
  const sp1 = theme.spacing(1);
  const sp2 = theme.spacing(2);
  const sp4 = theme.spacing(4);

  return c12nDef.enforce ? (
    <PageCenter margin={4} width="100%" textAlign="left">
      <div style={{ marginBottom: theme.spacing(4) }}>
        <Typography variant="h4">{t('title')}</Typography>
      </div>
      <div style={{ paddingBottom: sp4 }}>
        <Typography variant="h5" gutterBottom>
          {t('desc_title')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {t('desc_1')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {t('desc_2')}
        </Typography>
      </div>
      <div style={{ paddingBottom: sp4 }}>
        <Typography variant="h5" gutterBottom>
          {t('submission_title')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {t('submission_desc')}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('ex_title')}
        </Typography>
        <div style={{ paddingLeft: sp2 }}>
          <Typography variant="body2" gutterBottom>
            {t('assumptions')}
          </Typography>
          <ul>
            <li>
              <Trans ns="helpClassification" i18nKey="submission_a_1" components={{ bold: <strong /> }} />
              <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.RESTRICTED : null} format="long" />
            </li>
            <li>
              <Trans ns="helpClassification" i18nKey="submission_a_2" components={{ bold: <strong /> }} />
              <Classification
                inline
                size="tiny"
                type="text"
                c12n={c12nDef ? c12nDef.UNRESTRICTED : null}
                format="long"
              />
            </li>
            <li>
              <Trans ns="helpClassification" i18nKey="submission_a_3" components={{ bold: <strong /> }} />
            </li>
          </ul>
          <Typography variant="body2" gutterBottom>
            <Trans ns="helpClassification" i18nKey="submission_a_res_1_p1" components={{ bold: <strong /> }} />
            <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.UNRESTRICTED : null} format="long" />
            <Trans ns="helpClassification" i18nKey="submission_a_res_1_p2" components={{ bold: <strong /> }} />
          </Typography>
          <Typography variant="body2" gutterBottom>
            <Trans
              ns="helpClassification"
              i18nKey="submission_a_res_2_p1"
              components={{ italic: <i />, bold: <strong /> }}
            />
            <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.RESTRICTED : null} format="long" />
            <Trans
              ns="helpClassification"
              i18nKey="submission_a_res_2_p2"
              components={{ italic: <i />, bold: <strong /> }}
            />
          </Typography>
        </div>
      </div>
      <div style={{ paddingBottom: sp4 }}>
        <Typography variant="h5" gutterBottom>
          {t('result_title')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {t('result_desc')}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('ex_title')}
        </Typography>
        <div style={{ paddingLeft: sp2 }}>
          <Typography variant="body2" gutterBottom>
            {t('assumptions')}
          </Typography>
          <ul>
            <li>
              <Trans ns="helpClassification" i18nKey="result_a_1" components={{ bold: <strong /> }} />
              <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.RESTRICTED : null} format="long" />
            </li>
            <li>
              <Trans ns="helpClassification" i18nKey="result_a_2" components={{ bold: <strong /> }} />
              <Classification
                inline
                size="tiny"
                type="text"
                c12n={c12nDef ? c12nDef.UNRESTRICTED : null}
                format="long"
              />
            </li>
            <li>
              <Trans ns="helpClassification" i18nKey="result_a_3" components={{ bold: <strong /> }} />
              <Classification
                inline
                size="tiny"
                type="text"
                c12n={c12nDef ? c12nDef.UNRESTRICTED : null}
                format="long"
              />
            </li>
            <li>
              <Trans ns="helpClassification" i18nKey="result_a_4" components={{ bold: <strong /> }} />
              <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.RESTRICTED : null} format="long" />
            </li>
          </ul>
          <Typography variant="body2" gutterBottom>
            <Trans ns="helpClassification" i18nKey="result_a_res_1_p1" components={{ bold: <strong /> }} />
            <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.RESTRICTED : null} format="long" />
            <Trans ns="helpClassification" i18nKey="result_a_res_1_p2" components={{ bold: <strong /> }} />
            <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.UNRESTRICTED : null} format="long" />
            <Trans ns="helpClassification" i18nKey="result_a_res_1_p3" components={{ bold: <strong /> }} />
          </Typography>
          <Typography variant="body2" gutterBottom>
            <Trans ns="helpClassification" i18nKey="result_a_res_2_p1" components={{ bold: <strong /> }} />
            <Classification size="tiny" type="text" c12n={c12nDef ? c12nDef.RESTRICTED : null} format="long" />
            <Trans ns="helpClassification" i18nKey="result_a_res_2_p2" components={{ bold: <strong /> }} />
          </Typography>
        </div>
      </div>
      <div>
        <Typography variant="h5" gutterBottom>
          {t('validation_title')}
        </Typography>
      </div>
      <div style={{ paddingBottom: sp1 }}>
        <Typography variant="h6" gutterBottom>
          {t('validation_level')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <Trans ns="helpClassification" i18nKey="validation_level_desc" components={{ bold: <strong /> }} />
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('validation_level_supported')}
        </Typography>
        <ul>
          {c12nDef
            ? c12nDef.original_definition.levels.map((lvl, idx) => (
                <li key={idx}>
                  <Classification size="tiny" type="text" c12n={lvl.name} format="long" /> :: {lvl.description}
                </li>
              ))
            : Array.from({ length: 2 }).map((_, i) => (
                <li key={i}>
                  <Skeleton />
                </li>
              ))}
        </ul>
      </div>
      <div style={{ paddingBottom: sp1 }}>
        <Typography variant="h6" gutterBottom>
          {t('validation_required')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <Trans ns="helpClassification" i18nKey="validation_required_desc" components={{ bold: <strong /> }} />
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('validation_required_supported')}
        </Typography>
        <ul>
          {c12nDef ? (
            c12nDef.original_definition.required.length !== 0 ? (
              c12nDef.original_definition.required.map((req, idx) => (
                <li key={idx}>
                  <div style={{ display: 'inline-block', fontWeight: 700 }}>{req.name}</div>
                  {` :: ${req.description}`}
                </li>
              ))
            ) : (
              <Typography variant="body2" color="secondary">
                {t('validation_required_none')}
              </Typography>
            )
          ) : (
            Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <Skeleton />
              </li>
            ))
          )}
        </ul>
      </div>
      <div style={{ paddingBottom: sp1 }}>
        <Typography variant="h6" gutterBottom>
          {t('validation_groups')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <Trans ns="helpClassification" i18nKey="validation_groups_desc" components={{ bold: <strong /> }} />
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('validation_groups_supported')}
        </Typography>
        <ul>
          {c12nDef ? (
            c12nDef.original_definition.groups.length !== 0 ? (
              c12nDef.original_definition.groups.map((grp, idx) => (
                <li key={idx}>
                  <div style={{ display: 'inline-block', fontWeight: 700 }}>{grp.name}</div>
                  {` :: ${grp.description}`}
                </li>
              ))
            ) : (
              <Typography variant="body2" color="secondary">
                {t('validation_groups_none')}
              </Typography>
            )
          ) : (
            Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <Skeleton />
              </li>
            ))
          )}
        </ul>
        <Typography variant="subtitle2" gutterBottom color="error">
          <Trans ns="helpClassification" i18nKey="validation_groups_note" components={{ bold: <strong /> }} />
        </Typography>
      </div>
      <div>
        <Typography variant="h6" gutterBottom>
          {t('validation_subgroups')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <Trans ns="helpClassification" i18nKey="validation_subgroups_desc" components={{ bold: <strong /> }} />
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('validation_subgroups_supported')}
        </Typography>
        <ul>
          {c12nDef ? (
            c12nDef.original_definition.subgroups.length !== 0 ? (
              c12nDef.original_definition.subgroups.map((sgrp, idx) => (
                <li key={idx}>
                  <div style={{ display: 'inline-block', fontWeight: 700 }}>{sgrp.name}</div>
                  {` :: ${sgrp.description}`}
                </li>
              ))
            ) : (
              <Typography variant="body2" color="secondary">
                {t('validation_subgroups_none')}
              </Typography>
            )
          ) : (
            Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <Skeleton />
              </li>
            ))
          )}
        </ul>
        <Typography variant="subtitle2" gutterBottom color="error">
          <Trans ns="helpClassification" i18nKey="validation_subgroups_note" components={{ bold: <strong /> }} />
        </Typography>
      </div>
    </PageCenter>
  ) : (
    <NotFoundPage />
  );
}
