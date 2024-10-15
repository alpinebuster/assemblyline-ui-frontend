import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Divider, Grid, Skeleton, Typography, useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import useHighlighter from 'components/hooks/useHighlighter';
import { Heuristics } from 'components/models/ui/file';
import Heuristic from 'components/visual/Heuristic';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(theme => ({
  title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover, &:focus': {
      color: theme.palette.text.secondary
    }
  }
}));

type Props = {
  heuristics: Heuristics;
};

const WrappedHeuristicSection: React.FC<Props> = ({ heuristics }) => {
  const { t } = useTranslation(['submissionDetail']);
  const [open, setOpen] = React.useState(true);
  const theme = useTheme();
  const classes = useStyles();
  const sp2 = theme.spacing(2);
  const { getKey } = useHighlighter();

  return (
    <div style={{ paddingTop: sp2 }}>
      <Typography
        variant="h6"
        onClick={() => {
          setOpen(!open);
        }}
        className={classes.title}
      >
        <span>{t('heuristics')}</span>
        {open ? <ExpandLess /> : <ExpandMore />}
      </Typography>
      <Divider />
      <Collapse in={open} timeout="auto">
        {useMemo(
          () => (
            <div style={{ paddingBottom: sp2, paddingTop: sp2 }}>
              {heuristics
                ? Object.keys(heuristics).map((lvl, i) => (
                    <Grid container key={i}>
                      <Grid item xs={12} sm={3} lg={2} paddingTop={0.375}>
                        <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{t(`verdict.${lvl}`)}</span>
                      </Grid>
                      <Grid item xs={12} sm={9} lg={10}>
                        {heuristics[lvl].map(([cid, name], idx) => (
                          <Heuristic
                            key={`${cid}_${idx}`}
                            text={name}
                            lvl={lvl}
                            highlight_key={getKey('heuristic', cid)}
                          />
                        ))}
                      </Grid>
                    </Grid>
                  ))
                : [...Array(3)].map((_, i) => (
                    <Grid container key={i} spacing={1}>
                      <Grid item xs={12} sm={3} lg={2}>
                        <Skeleton style={{ height: '2rem' }} />
                      </Grid>
                      <Grid item xs={12} sm={9} lg={10}>
                        <Skeleton style={{ height: '2rem' }} />
                      </Grid>
                    </Grid>
                  ))}
            </div>
          ),
          // eslint-disable-next-line react-hooks/exhaustive-deps
          [getKey, heuristics, t]
        )}
      </Collapse>
    </div>
  );
};
const HeuristicSection = React.memo(WrappedHeuristicSection);

export default HeuristicSection;
