import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SelectAllOutlinedIcon from '@mui/icons-material/SelectAllOutlined';
import { Collapse, IconButton, Skeleton, Tooltip, useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import useHighlighter from 'components/hooks/useHighlighter';
import useSafeResults from 'components/hooks/useSafeResults';
import { HEURISTIC_LEVELS, HeuristicLevel } from 'components/models/base/heuristic';
import { Section } from 'components/models/base/result';
import type { File } from 'components/models/ui/file';
import ResultSection from 'components/visual/ResultCard/result_section';
import SectionContainer from 'components/visual/SectionContainer';
import { safeFieldValueURI } from 'helpers/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_SEC_SCORE = -1000;
const SCORE_SHOW_THRESHOLD = 0;

const useStyles = makeStyles(theme => ({
  header: {
    fontWeight: 500,
    fontSize: 'larger',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  header_malicious: {
    color: theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark,
    backgroundColor: '#f2000025',
    '&:hover, &:focus': {
      backgroundColor: '#f2000035'
    }
  },
  header_suspicious: {
    color: theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark,
    backgroundColor: '#ff970025',
    '&:hover, &:focus': {
      backgroundColor: '#ff970035'
    }
  },
  header_info: {
    backgroundColor: '#6e6e6e25',
    '&:hover, &:focus': {
      backgroundColor: '#6e6e6e35'
    }
  },
  header_safe: {
    color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
    backgroundColor: '#00f20025',
    '&:hover, &:focus': {
      backgroundColor: '#00f20035'
    }
  },
  container: {
    borderRadius: theme.spacing(0.5),
    marginBottom: theme.spacing(0.25),
    overflow: 'hidden'
  },
  container_malicious: {
    border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark}`
  },
  container_suspicious: {
    border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark}`
  },
  container_info: {
    border: `1px solid ${theme.palette.divider}`
  },
  container_safe: {
    border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark}`
  },
  container_highlight: {
    border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.info.dark}`
  },
  highlighted: {
    color: theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.primary.main,
    backgroundColor: theme.palette.mode === 'dark' ? '#3d485b' : '#cae8f9',
    '&:hover, &:focus': {
      backgroundColor: theme.palette.mode === 'dark' ? '#343a44' : '#e2f2fa'
    }
  }
}));

type HeuristicProps = {
  name: string;
  id: string;
  sections: Section[];
  level: HeuristicLevel;
  force?: boolean;
};

const WrappedHeuristic: React.FC<HeuristicProps> = ({ name, id, sections, level, force = false }: HeuristicProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [render, setRender] = React.useState(false);
  const { isHighlighted, triggerHighlight, getKey } = useHighlighter();
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSafeResults } = useSafeResults();

  const highlighted = isHighlighted(getKey('heuristic', id));

  const stopPropagating = useCallback(event => event.stopPropagation(), []);

  const handleHighlight = useCallback(() => triggerHighlight(getKey('heuristic', id)), [triggerHighlight, getKey, id]);

  return level === 'safe' && !showSafeResults && !force ? null : (
    <div
      className={clsx(
        classes.container,
        classes[`container_${level}`],
        highlighted ? classes.container_highlight : null
      )}
    >
      <div
        className={clsx(classes.header, classes[`header_${level}`], highlighted ? classes.highlighted : null)}
        onClick={() => setOpen(!open)}
      >
        <div>
          {name} <span style={{ fontSize: 'small' }}>({id})</span>
        </div>
        <div onClick={stopPropagating} style={{ display: 'flex', justifyContent: 'flex-end', flexGrow: 0 }}>
          <Tooltip title={t('related')}>
            <IconButton
              component={Link}
              size="small"
              to={`/search/result?query=result.sections.heuristic.heur_id:${safeFieldValueURI(id)}`}
              color="inherit"
            >
              <SearchOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('highlight')}>
            <IconButton size="small" onClick={handleHighlight} color="inherit">
              <SelectAllOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('goto_heuristic')}>
            <IconButton
              component={Link}
              size="small"
              to={`/manage/heuristic/${id}`}
              color="inherit"
              onClick={e => {
                e.preventDefault();
                navigate(`${location.pathname.split('/').slice(0, 4).join('/')}#${id}`);
              }}
            >
              <OpenInNewOutlinedIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <Collapse in={open} timeout="auto" style={{ marginRight: theme.spacing(0.5) }} onEnter={() => setRender(true)}>
        {sections &&
          render &&
          sections.map((section, sid) => (
            <div key={sid}>
              <ResultSection section={section} indent={1} depth={1} force={force} />
            </div>
          ))}
      </Collapse>
    </div>
  );
};

const Heuristic = React.memo(WrappedHeuristic);

type DetectionProps = Partial<File> & {
  section_map?: { [heur_id: string]: Section[] };
  force?: boolean;
  nocollapse?: boolean;
};

const WrappedDetection: React.FC<DetectionProps> = ({
  heuristics,
  results,
  section_map = null,
  force = false,
  nocollapse = false
}) => {
  const { t } = useTranslation(['fileDetail']);
  const { showSafeResults } = useSafeResults();

  const [sectionMap, setSectionMap] = useState<{ [heur_id: string]: Section[] }>({});
  const [maxScore, setMaxScore] = useState<number>(DEFAULT_SEC_SCORE);

  useEffect(() => {
    if (results) {
      let newMaxScore = DEFAULT_SEC_SCORE;
      const newSectionMap = {};
      for (const res of results) {
        for (const sec of res.result.sections
          .filter(s => s.heuristic)
          .sort((a, b) => (a.heuristic.score <= b.heuristic.score ? 1 : -1))) {
          if (!newSectionMap.hasOwnProperty(sec.heuristic.heur_id)) {
            newSectionMap[sec.heuristic.heur_id] = [];
          }
          if (sec.heuristic.score > newMaxScore) {
            newMaxScore = sec.heuristic.score;
          }
          newSectionMap[sec.heuristic.heur_id].push(sec);
        }
      }
      setSectionMap(newSectionMap);
      setMaxScore(newMaxScore);
    }
  }, [results]);

  useEffect(() => {
    if (section_map) {
      let newMaxScore = DEFAULT_SEC_SCORE;
      for (const heurId of Object.keys(section_map)) {
        for (const sec of section_map[heurId]) {
          if (sec.heuristic.score >= SCORE_SHOW_THRESHOLD) {
            newMaxScore = sec.heuristic.score;
            break;
          }
        }
        if (newMaxScore >= SCORE_SHOW_THRESHOLD) {
          break;
        }
      }
      setSectionMap(section_map);
      setMaxScore(newMaxScore);
    }
  }, [section_map]);

  return (heuristics && Object.keys(heuristics).length === 0) ||
    (heuristics && maxScore < SCORE_SHOW_THRESHOLD && !showSafeResults && !force) ? null : (
    <SectionContainer title={t('heuristics')} nocollapse={nocollapse}>
      {sectionMap && heuristics
        ? HEURISTIC_LEVELS.map((lvl, lid) => {
            return heuristics[lvl] ? (
              <div key={lid}>
                {heuristics[lvl].map(([hid, hname], idx) => {
                  return (
                    <div key={idx}>
                      <Heuristic name={hname} id={hid} sections={sectionMap[hid]} level={lvl} force={force} />
                    </div>
                  );
                })}
              </div>
            ) : null;
          })
        : [...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '3rem' }} />)}
    </SectionContainer>
  );
};

const Detection = React.memo(WrappedDetection);
export default Detection;
