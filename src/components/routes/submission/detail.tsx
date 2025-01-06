import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import ChromeReaderModeOutlinedIcon from '@mui/icons-material/ChromeReaderModeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import {
  Alert,
  DialogContentText,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Radio,
  RadioGroup,
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import useALContext from 'components/hooks/useALContext';
import useAssistant from 'components/hooks/useAssistant';
import useDrawer from 'components/hooks/useDrawer';
import useHighlighter from 'components/hooks/useHighlighter';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { ArchiverMetadata } from 'components/models/base/config';
import type { ParsedErrors } from 'components/models/base/error';
import type { ParsedSubmission, Submission } from 'components/models/base/submission';
import type { Configuration } from 'components/models/ui/help';
import type { LiveStatus, OutstandingServices, WatchQueue } from 'components/models/ui/live';
import type { MultipleKeys } from 'components/models/ui/result';
import type { SubmissionSummary, SubmissionTags, SubmissionTree } from 'components/models/ui/submission';
import ForbiddenPage from 'components/routes/403';
import HeuristicDetail from 'components/routes/manage/heuristic_detail';
import Classification from 'components/visual/Classification';
import ConfirmationDialog from 'components/visual/ConfirmationDialog';
import FileDetail from 'components/visual/FileDetail';
import Detection from 'components/visual/FileDetail/detection';
import FileDownloader from 'components/visual/FileDownloader';
import MetadataInputField from 'components/visual/MetadataInputField';
import VerdictBar from 'components/visual/VerdictBar';
import { getErrorIDFromKey, getServiceFromKey } from 'helpers/errors';
import { setNotifyFavicon } from 'helpers/utils';
import moment from 'moment';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { Link, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import AISummarySection from './detail/ai_summary';
import AttackSection from './detail/attack';
import ErrorSection from './detail/errors';
import FileTreeSection from './detail/file_tree';
import InfoSection from './detail/info';
import MetaSection from './detail/meta';
import TagSection from './detail/tags';

const NAMESPACE = '/live_submission';
const MESSAGE_TIMEOUT = 5000;
const OUTSTANDING_TRIGGER_COUNT = 4;

type ParamProps = {
  id: string;
  fid?: string;
};

const resultReducer = (currentResults, newResults) => {
  if (newResults === null) return null;
  if (currentResults === null) return newResults;

  return {
    result: { ...currentResults.result, ...newResults.result },
    error: { ...currentResults.error, ...newResults.error }
  };
};

const messageReducer = (messages: string[], receivedMessages: string[]) => {
  if (receivedMessages === null) return [];

  const newMessages = receivedMessages.filter(item => messages.indexOf(item) === -1);
  if (newMessages.length !== 0) {
    return [...messages, ...newMessages];
  }
  return messages;
};

const incrementReducer = (old: number, increment: number) => {
  if (increment === null) return 0;
  return old + increment;
};

function WrappedSubmissionDetail() {
  const { t, i18n } = useTranslation(['submissionDetail']);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { apiCall } = useMyAPI();
  const { addInsight, removeInsight } = useAssistant();
  const { showSuccessMessage, showErrorMessage } = useMySnackbar();
  const { user: currentUser, c12nDef, configuration: systemConfig, settings } = useALContext();
  const { setHighlightMap } = useHighlighter();
  const { setGlobalDrawer, globalDrawerOpened } = useDrawer();
  const { id, fid } = useParams<ParamProps>();

  const [submission, setSubmission] = useState<ParsedSubmission>(null);
  const [summary, setSummary] = useState<SubmissionSummary>(null);
  const [tree, setTree] = useState<SubmissionTree['tree']>(null);
  const [filtered, setFiltered] = useState<boolean>(false);
  const [partial, setPartial] = useState<boolean>(false);
  const [watchQueue, setWatchQueue] = useState<string>(null);
  const [configuration, setConfiguration] = useState<Configuration>(null);
  const [liveErrors, setLiveErrors] = useState<string[]>(null);
  const [liveTagMap, setLiveTagMap] = useState<SubmissionTags>(null);
  const [outstanding, setOutstanding] = useState<OutstandingServices>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('queued');
  const [socket, setSocket] = useState<Socket>(null);
  const [loadInterval, setLoadInterval] = useState<any>(null);
  const [lastSuccessfulTrigger, setLastSuccessfulTrigger] = useState<number>(0);
  const [archiveDialog, setArchiveDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [waitingDialog, setWaitingDialog] = useState<boolean>(false);
  const [resubmitAnchor, setResubmitAnchor] = useState<Element>(null);
  const [baseFiles, setBaseFiles] = useState<string[]>([]);
  const [archivingMetadata, setArchivingMetadata] = useState<Record<string, ArchiverMetadata>>({});
  const [archivingUseAlternateDtl, setArchivingUseAlternateDtl] = useState<string>('false');

  const [liveResultKeys, setLiveResultKeys] = useReducer(messageReducer, []);
  const [liveErrorKeys, setLiveErrorKeys] = useReducer(messageReducer, []);
  const [processedKeys, setProcessedKeys] = useReducer(messageReducer, []);
  const [liveResults, setLiveResults] = useReducer(resultReducer, null);
  const [loadTrigger, incrementLoadTrigger] = useReducer(incrementReducer, 0);

  const sp4 = theme.spacing(4);

  const popoverOpen = Boolean(resubmitAnchor);

  const updateLiveSumary = (results: object) => {
    const tempSummary: any = summary !== null ? { ...summary } : { tags: {}, heuristics: {}, attack_matrix: {} };
    const tempTagMap = liveTagMap !== null ? { ...liveTagMap } : {};

    Object.entries(results).forEach(([resultKey, result]) => {
      const key = resultKey.substr(0, 64);

      if (!Object.hasOwnProperty.call(tempTagMap, key)) {
        tempTagMap[key] = [];
      }

      // eslint-disable-next-line guard-for-in
      for (const sectionID in result.result.sections) {
        const section = result.result.sections[sectionID];
        let hType = 'info';
        if (section.heuristic !== null && section.heuristic !== undefined) {
          // #1: Get heuristic score
          if (section.heuristic.score < 0) {
            hType = 'safe';
          } else if (section.heuristic.score < 300) {
            hType = 'info';
          } else if (section.heuristic.score < 1000) {
            hType = 'suspicious';
          } else {
            hType = 'malicious';
          }

          // #2: Parse heuristics
          if (!Object.hasOwnProperty.call(tempSummary.heuristics, hType)) {
            tempSummary.heuristics[hType] = [];
          }

          let heurExists = false;
          const heurItem = [section.heuristic.heur_id, section.heuristic.name];
          for (const i in tempSummary.heuristics[hType]) {
            if (
              tempSummary.heuristics[hType][i][0] === heurItem[0] &&
              tempSummary.heuristics[hType][i][1] === heurItem[1]
            ) {
              heurExists = true;
              break;
            }
          }

          if (!heurExists) {
            tempSummary.heuristics[hType].push(heurItem);

            const heurKey = `heuristic__${section.heuristic.heur_id}`;
            tempTagMap[key].push(heurKey);
            if (!Object.hasOwnProperty.call(tempTagMap, heurKey)) {
              tempTagMap[heurKey] = [];
            }
            tempTagMap[heurKey].push(key);
          }

          // #3: Parse Att&cks
          if (section.heuristic.attack) {
            // eslint-disable-next-line guard-for-in
            for (const i in section.heuristic.attack) {
              const attack = section.heuristic.attack[i];
              // eslint-disable-next-line guard-for-in
              for (const j in attack.categories) {
                const cat = attack.categories[j];
                if (!Object.hasOwnProperty.call(tempSummary.attack_matrix, cat)) {
                  tempSummary.attack_matrix[cat] = [];
                }

                let attExists = false;
                const attackItem = [attack.attack_id, attack.pattern, hType];
                for (const k in tempSummary.attack_matrix[cat]) {
                  if (
                    tempSummary.attack_matrix[cat][k][0] === attackItem[0] &&
                    tempSummary.attack_matrix[cat][k][1] === attackItem[1] &&
                    tempSummary.attack_matrix[cat][k][2] === attackItem[2]
                  ) {
                    attExists = true;
                    break;
                  }
                }
                if (!attExists) {
                  tempSummary.attack_matrix[cat].push(attackItem);

                  const attKey = `attack_pattern__${attack.attack_id}`;
                  tempTagMap[key].push(attKey);
                  if (!Object.hasOwnProperty.call(tempTagMap, attKey)) {
                    tempTagMap[attKey] = [];
                  }
                  tempTagMap[attKey].push(key);
                }
              }
            }
          }
        }

        // #3: Parse Tags
        // eslint-disable-next-line guard-for-in
        for (const tagID in section.tags) {
          const tag = section.tags[tagID];
          let summaryType = null;
          if (configuration['submission.tag_types.attribution'].indexOf(tag.type) !== -1) {
            summaryType = 'attribution';
          } else if (configuration['submission.tag_types.behavior'].indexOf(tag.type) !== -1) {
            summaryType = 'behavior';
          } else if (configuration['submission.tag_types.ioc'].indexOf(tag.type) !== -1) {
            summaryType = 'ioc';
          }

          if (summaryType !== null) {
            if (!Object.hasOwnProperty.call(tempSummary.tags, summaryType)) {
              tempSummary.tags[summaryType] = {};
            }

            if (!Object.hasOwnProperty.call(tempSummary.tags[summaryType], tag.type)) {
              tempSummary.tags[summaryType][tag.type] = [];
            }

            let exists = false;
            const tagVal = [tag.value, hType];
            for (const i in tempSummary.tags[summaryType][tag.type]) {
              if (
                tempSummary.tags[summaryType][tag.type][i][0] === tagVal[0] &&
                tempSummary.tags[summaryType][tag.type][i][1] === tagVal[1]
              ) {
                exists = true;
                break;
              }
            }

            if (!exists) {
              tempSummary.tags[summaryType][tag.type].push(tagVal);

              const tagKey = `${tag.type}__${tag.value}`;
              tempTagMap[key].push(tagKey);
              if (!Object.hasOwnProperty.call(tempTagMap, tagKey)) {
                tempTagMap[tagKey] = [];
              }
              tempTagMap[tagKey].push(key);
            }
          }
        }
      }
    });
    setLiveTagMap(tempTagMap as any);
    setHighlightMap(tempTagMap as any);
    setSummary(tempSummary);
  };

  const updateLiveFileTree = (results: object) => {
    const tempTree = tree !== null ? { ...tree } : {};

    const searchFileTree = (sha256: string, currentTree: object) => {
      let output = [];
      Object.entries(currentTree).forEach(([key, val]) => {
        if (Object.keys(val.children).length !== 0) {
          output = [...output, ...searchFileTree(sha256, val.children)];
        }
        if (key === sha256) {
          output.push(val);
        }
      });
      return output;
    };

    const getFilenameFromSHA256 = sha256 => {
      if (submission !== null) {
        for (const i in submission.files) {
          if (submission.files[i].sha256 === sha256) {
            return submission.files[i].name;
          }
        }
      }

      return null;
    };
    Object.entries(results).forEach(([resultKey, result]) => {
      const key = resultKey.substr(0, 64);

      const toUpdate = searchFileTree(key, tempTree);

      if (toUpdate.length === 0) {
        const fname = getFilenameFromSHA256(key);

        if (fname != null) {
          tempTree[key] = { children: {}, name: [fname], score: 0, sha256: key, type: 'N/A' };
          toUpdate.push(tempTree[key]);
        } else {
          if (!Object.hasOwnProperty.call(tempTree, 'TBD')) {
            tempTree.TBD = { children: {}, name: ['Undetermined Parent'], score: 0, type: 'N/A' };
          }

          tempTree.TBD.children[key] = { children: {}, name: [key], score: 0, sha256: key, type: 'N/A' };
          toUpdate.push(tempTree.TBD.children[key]);
        }
      }
      const toDelTDB = [];
      for (const idx in toUpdate) {
        if (Object.hasOwnProperty.call(toUpdate, idx)) {
          const item = toUpdate[idx];
          if (result.result.score !== undefined) {
            item.score += result.result.score;
          }

          for (const i in result.response.extracted) {
            if (Object.hasOwnProperty.call(result.response.extracted, i)) {
              const { sha256, name } = result.response.extracted[i];

              if (!Object.hasOwnProperty.call(item.children, sha256)) {
                if (
                  Object.hasOwnProperty.call(tempTree, 'TBD') &&
                  Object.hasOwnProperty.call(tempTree.TBD.children, sha256)
                ) {
                  item.children[sha256] = tempTree.TBD.children[sha256];
                  item.children[sha256].name = [name];
                  if (toDelTDB.indexOf(sha256) === -1) toDelTDB.push(sha256);
                } else {
                  item.children[sha256] = { children: {}, name: [name], score: 0, sha256, type: 'N/A' };
                }
              } else {
                item.children[sha256].name.push(name);
              }
            }
          }
        }
      }

      for (const idxDel in toDelTDB) {
        if (Object.hasOwnProperty.call(toDelTDB, idxDel)) {
          delete tempTree.TBD.children[toDelTDB[idxDel]];
        }
      }
    });

    if (tempTree.TBD && Object.keys(tempTree.TBD.children).length === 0) delete tempTree.TBD;
    setTree(tempTree);
  };

  const getParsedErrors = useCallback((errorList: string[]): ParsedErrors => {
    const aggregated = errors => {
      const out = {
        depth: [],
        files: [],
        retry: [],
        down: [],
        busy: [],
        preempted: [],
        exception: [],
        unknown: []
      };
      errors.forEach(error => {
        const srv = getServiceFromKey(error);
        const eID = getErrorIDFromKey(error);

        if (eID === '20') {
          if (out.busy.indexOf(srv) === -1) {
            out.busy.push(srv);
          }
        }
        if (eID === '21') {
          if (out.down.indexOf(srv) === -1) {
            out.down.push(srv);
          }
        } else if (eID === '12') {
          if (out.retry.indexOf(srv) === -1) {
            out.retry.push(srv);
          }
        } else if (eID === '10') {
          if (out.depth.indexOf(srv) === -1) {
            out.depth.push(srv);
          }
        } else if (eID === '11') {
          if (out.files.indexOf(srv) === -1) {
            out.files.push(srv);
          }
        } else if (eID === '30') {
          if (out.preempted.indexOf(srv) === -1) {
            out.preempted.push(srv);
          }
        } else if (eID === '0') {
          if (out.unknown.indexOf(srv) === -1) {
            out.unknown.push(srv);
          }
        } else if (eID === '1') {
          if (out.exception.indexOf(srv) === -1) {
            out.exception.push(srv);
          }
        }
      });

      out.busy.sort();
      out.down.sort();
      out.depth.sort();
      out.files.sort();
      out.retry.sort();
      out.exception.sort();
      out.unknown.sort();

      return out;
    };

    return {
      aggregated: aggregated(errorList),
      listed: errorList,
      services: []
    };
  }, []);

  const parseSubmissionErrors = useCallback(
    (current: Submission): ParsedSubmission => ({
      ...current,
      parsed_errors: getParsedErrors(current.errors)
    }),
    [getParsedErrors]
  );

  const resetLiveMode = useCallback(() => {
    if (socket) {
      // Disconnect socket
      socket.disconnect();

      // Reset all live mode states
      setLiveResultKeys(null);
      setLiveErrorKeys(null);
      setProcessedKeys(null);
      setLiveResults(null);
      setLiveErrors(null);
      setLiveTagMap(null);
      setSocket(null);
      setOutstanding(null);
      incrementLoadTrigger(null);
      setLastSuccessfulTrigger(0);
      setWatchQueue(null);
    }
  }, [socket]);

  const archive = useCallback(() => {
    if (submission != null) {
      apiCall<{ success: boolean; action: 'archive' | 'resubmit'; sid: string }>({
        method: 'PUT',
        url: `/api/v4/archive/${submission.sid}/${archivingUseAlternateDtl === 'true' ? '?use_alternate_dtl' : ''}`,
        body: archivingMetadata,
        onSuccess: api_data => {
          if (api_data.api_response.success) {
            showSuccessMessage(
              t(
                ['archive', 'hooked'].includes(api_data.api_response.action)
                  ? 'archive.success'
                  : 'archive.success.resubmit'
              )
            );
            setSubmission({ ...submission, archived: true });
          } else {
            showErrorMessage(t('archive.failed'));
          }
          setArchiveDialog(false);
        },
        onEnter: () => setWaitingDialog(true),
        onExit: () => setWaitingDialog(false)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessMessage, submission, t]);

  const resubmit = useCallback(() => {
    if (submission != null) {
      apiCall<Submission>({
        url: `/api/v4/submit/resubmit/${submission.sid}/`,
        onSuccess: api_data => {
          showSuccessMessage(t('submit.success'));
          resetLiveMode();
          setSubmission(null);
          setSummary(null);
          setTree(null);
          setTimeout(() => {
            navigate(`/submission/detail/${api_data.api_response.sid}`);
          }, 500);
        }
      });
    }
    setResubmitAnchor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetLiveMode, showSuccessMessage, submission, t]);

  const resubmitDynamic = useCallback(() => {
    if (submission != null) {
      apiCall<Submission>({
        url: `/api/v4/submit/dynamic/${submission.files[0].sha256}/?copy_sid=${submission.sid}`,
        onSuccess: api_data => {
          showSuccessMessage(t('submit.success'));
          resetLiveMode();
          setSubmission(null);
          setSummary(null);
          setTree(null);
          setTimeout(() => {
            navigate(`/submission/detail/${api_data.api_response.sid}`);
          }, 500);
        }
      });
    }
    setResubmitAnchor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessMessage, submission, t]);

  const replay = useCallback(() => {
    if (submission != null && systemConfig.ui.allow_replay) {
      apiCall({
        url: `/api/v4/replay/submission/${submission.sid}/`,
        onSuccess: api_data => {
          showSuccessMessage(t('replay.success'));
          const metadata = { ...submission.metadata, replay: 'requested' };
          setSubmission({ ...submission, metadata });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessMessage, submission, systemConfig.ui.allow_replay, t]);

  const deleteSubmission = () => {
    if (submission != null) {
      apiCall({
        method: 'DELETE',
        url: `/api/v4/submission/${submission.sid}/`,
        onSuccess: api_data => {
          showSuccessMessage(t('delete.success'));
          setDeleteDialog(false);
          setTimeout(() => {
            navigate('/submissions');
          }, 500);
        },
        onEnter: () => setWaitingDialog(true),
        onExit: () => setWaitingDialog(false)
      });
    }
  };

  const setVerdict = useCallback(
    verdict => {
      if (submission != null && submission.verdict[verdict].indexOf(currentUser.username) === -1) {
        apiCall<{ success: boolean }>({
          method: 'PUT',
          url: `/api/v4/submission/verdict/${submission.sid}/${verdict}/`,
          onSuccess: api_data => {
            if (!api_data.api_response.success) {
              return;
            }
            const newSubmission = { ...submission };
            if (verdict === 'malicious') {
              if (newSubmission.verdict.malicious.indexOf(currentUser.username) === -1) {
                newSubmission.verdict.malicious.push(currentUser.username);
              }
              if (newSubmission.verdict.non_malicious.indexOf(currentUser.username) !== -1) {
                newSubmission.verdict.non_malicious.splice(
                  newSubmission.verdict.non_malicious.indexOf(currentUser.username),
                  1
                );
              }
            } else {
              if (newSubmission.verdict.non_malicious.indexOf(currentUser.username) === -1) {
                newSubmission.verdict.non_malicious.push(currentUser.username);
              }
              if (newSubmission.verdict.malicious.indexOf(currentUser.username) !== -1) {
                newSubmission.verdict.malicious.splice(submission.verdict.malicious.indexOf(currentUser.username), 1);
              }
            }
            setSubmission(newSubmission);
          }
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.username, submission]
  );

  const loadDefaultArchivingMetadata = () => {
    // Load the default archiving metadata
    if (systemConfig.submission.metadata && systemConfig.submission.metadata.archive) {
      const tempMeta = {};
      for (const metaKey in systemConfig.submission.metadata.archive) {
        const metaConfig = systemConfig.submission.metadata.archive[metaKey];
        if (metaConfig.default !== null) {
          tempMeta[metaKey] = metaConfig.default;
        }
      }
      if (tempMeta) {
        setArchivingMetadata(submission ? { ...tempMeta, ...submission.metadata } : tempMeta);
      }
    }
  };

  useEffect(() => {
    if (currentUser.roles.includes('submission_view')) {
      apiCall<Configuration>({
        url: '/api/v4/help/configuration/',
        onSuccess: api_data => {
          setConfiguration(api_data.api_response);
        }
      });
      apiCall<Submission>({
        url: `/api/v4/submission/${id}/`,
        onSuccess: api_data => {
          setSubmission(parseSubmissionErrors(api_data.api_response));
        }
      });
    }
    return () => {
      setSubmission(null);
      setSummary(null);
      setTree(null);
      setFiltered(false);
      setPartial(false);
      setWatchQueue(null);
      setConfiguration(null);
      setLiveErrors(null);
      setLiveTagMap(null);
      setOutstanding(null);
      setLiveStatus('queued');
      setSocket(null);
      setLoadInterval(null);
      setLastSuccessfulTrigger(0);
      setDeleteDialog(false);
      setArchiveDialog(false);
      setWaitingDialog(false);
      setResubmitAnchor(null);
      setBaseFiles([]);
      setArchivingMetadata({});
      setArchivingUseAlternateDtl('false');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (submission) {
      if (submission.state === 'completed') {
        if (socket) setNotifyFavicon();
        resetLiveMode();
        apiCall<SubmissionSummary>({
          url: `/api/v4/submission/summary/${id}/`,
          onSuccess: summ_data => {
            setHighlightMap(summ_data.api_response.map);
            setSummary(summ_data.api_response);
            if (summ_data.api_response.filtered) {
              setFiltered(true);
            }
            if (summ_data.api_response.partial) {
              setPartial(true);
            }
          }
        });
        apiCall<SubmissionTree>({
          url: `/api/v4/submission/tree/${id}/`,
          onSuccess: tree_data => {
            setTree(tree_data.api_response.tree);
            if (tree_data.api_response.filtered) {
              setFiltered(true);
            }
            if (tree_data.api_response.partial) {
              setPartial(true);
            }
          }
        });

        // Load the default values for the archiving metadata
        loadDefaultArchivingMetadata();
      } else {
        if (!socket) {
          // eslint-disable-next-line no-console
          console.debug('SocketIO :: Init => Create SocketIO client...');
          const tempSocket = io(NAMESPACE);
          tempSocket.on('connect', () => {
            // eslint-disable-next-line no-console
            console.debug('SocketIO :: Conn => Connecting to socketIO server...');
          });
          tempSocket.on('disconnect', () => {
            // eslint-disable-next-line no-console
            console.debug('SocketIO :: Conn => Disconnected from socketIO server...');
          });
          setSocket(tempSocket);
        }
        setLoadInterval(setInterval(() => incrementLoadTrigger(1), MESSAGE_TIMEOUT));
        setLiveStatus('processing');
      }
      setBaseFiles(submission.files.map(f => f.sha256));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission, systemConfig]);

  useEffect(() => {
    if (liveStatus === 'processing') {
      apiCall<WatchQueue>({
        url: `/api/v4/live/setup_watch_queue/${id}/`,
        onSuccess: api_data => {
          setWatchQueue(api_data.api_response.wq_id);
        },
        onFailure: () => {
          setLiveStatus('queued');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatus]);

  const handleErrorMessage = useCallback(
    data => {
      // eslint-disable-next-line no-console
      console.debug(`SocketIO :: onError => ${data.msg}`);
      apiCall<{ wq_id: string }>({
        url: `/api/v4/live/setup_watch_queue/${id}/`,
        onSuccess: summ_data => {
          setWatchQueue(summ_data.api_response.wq_id);
        },
        onFailure: () => {
          setLiveStatus('queued');
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  const handleStartMessage = data => {
    // eslint-disable-next-line no-console
    console.debug(`SocketIO :: onStart => ${data.msg}`);
    setTimeout(() => incrementLoadTrigger(1), 500);
  };

  const handleStopMessage = useCallback(
    data => {
      // eslint-disable-next-line no-console
      console.debug(`SocketIO :: onStop => ${data.msg}`);

      setTimeout(() => {
        if (loadInterval) clearInterval(loadInterval);
        setLoadInterval(null);
        setOutstanding(null);
        // Loading final submission
        apiCall<Submission>({
          url: `/api/v4/submission/${id}/`,
          onSuccess: api_data => {
            setSubmission(parseSubmissionErrors(api_data.api_response));
          }
        });
      }, 2000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  const handleCacheKeyMessage = data => {
    // eslint-disable-next-line no-console
    console.debug(`SocketIO :: onCacheKey => ${data.msg}`);
    setLiveResultKeys([data.msg]);
  };

  const handleCacheKeyErrrorMessage = data => {
    // eslint-disable-next-line no-console
    console.debug(`SocketIO :: onCacheKeyError => ${data.msg}`);
    setLiveErrorKeys([data.msg]);
  };

  const resetOutstanding = () => {
    setLastSuccessfulTrigger(loadTrigger);
    setOutstanding(null);
  };

  useEffect(
    () => () => {
      if (loadInterval) clearInterval(loadInterval);
    },
    [loadInterval]
  );

  useEffect(() => {
    if (socket) {
      // eslint-disable-next-line no-console
      console.debug('SocketIO :: Init => Registering SocketIO Callbacks...');
      socket.on('error', handleErrorMessage);
      socket.on('start', handleStartMessage);
      socket.on('stop', handleStopMessage);
      socket.on('cachekey', handleCacheKeyMessage);
      socket.on('cachekeyerr', handleCacheKeyErrrorMessage);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket, handleErrorMessage, handleStopMessage]);

  useEffect(() => {
    if (watchQueue && socket) {
      // eslint-disable-next-line no-console
      console.debug(`SocketIO :: emitListen => Listening for messages on watch queue: ${watchQueue}`);
      socket.emit('listen', { wq_id: watchQueue, from_start: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchQueue, socket, handleErrorMessage]);

  useEffect(() => {
    if (submission !== null && !globalDrawerOpened && fid !== undefined) {
      navigate(`/submission/detail/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDrawerOpened]);

  useEffect(() => {
    if (fid) {
      if (liveResults) {
        const curFileLiveResults = [];
        const curFileLiveErrors = [];
        Object.entries(liveResults.result).forEach(([resultKey, result]) => {
          if (resultKey.startsWith(fid)) {
            curFileLiveResults.push(result);
          }
        });
        Object.entries(liveResults.error).forEach(([errorKey, error]) => {
          if (errorKey.startsWith(fid)) {
            curFileLiveErrors.push(error);
          }
        });
        setGlobalDrawer(
          <FileDetail
            sha256={fid}
            sid={id}
            liveResultKeys={liveResultKeys}
            liveErrors={curFileLiveErrors}
            force={submission && submission.max_score < 0}
          />,
          { hasMaximize: true }
        );
      } else {
        setGlobalDrawer(<FileDetail sha256={fid} sid={id} force={submission && submission.max_score < 0} />, {
          hasMaximize: true
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid, submission]);

  useEffect(() => {
    if (!fid && location.hash) {
      setGlobalDrawer(<HeuristicDetail heur_id={location.hash.slice(1)} />);
    }
  }, [fid, location.hash, setGlobalDrawer]);

  useEffect(() => {
    if (!fid && !location.hash) setGlobalDrawer(null);
  }, [fid, location.hash, setGlobalDrawer]);

  useEffect(() => {
    if (!fid && !globalDrawerOpened && location.hash) {
      navigate(`${location.pathname}${location.search ? location.search : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid, globalDrawerOpened]);

  useEffect(() => {
    if (loadTrigger === 0) return;

    // eslint-disable-next-line no-console
    console.debug('LIVE :: Checking for new keys to load...');
    const newResults = liveResultKeys.filter(msg => processedKeys.indexOf(msg) === -1);
    const newErrors = liveErrorKeys.filter(msg => processedKeys.indexOf(msg) === -1);
    if (newResults.length !== 0 || newErrors.length !== 0) {
      // eslint-disable-next-line no-console
      console.debug(`LIVE :: New Results: ${newResults.join(' | ')} - New Errors: ${newErrors.join(' | ')}`);
      setLiveErrors(liveErrorKeys);

      apiCall<MultipleKeys>({
        method: 'POST',
        url: '/api/v4/result/multiple_keys/',
        body: { error: newErrors, result: newResults },
        onSuccess: api_data => {
          setLastSuccessfulTrigger(loadTrigger);
          setProcessedKeys([...newResults, ...newErrors]);
          setLiveResults(api_data.api_response);
          updateLiveFileTree(api_data.api_response.result);
          updateLiveSumary(api_data.api_response.result);
        }
      });
    } else if (
      loadTrigger >= lastSuccessfulTrigger + OUTSTANDING_TRIGGER_COUNT &&
      loadTrigger % OUTSTANDING_TRIGGER_COUNT === 0
    ) {
      // eslint-disable-next-line no-console
      console.debug('LIVE :: Finding out oustanding services...');

      apiCall<OutstandingServices>({
        url: `/api/v4/live/outstanding_services/${id}/`,
        onSuccess: api_data => {
          let newLiveStatus: 'processing' | 'rescheduled' | 'queued' = 'processing' as const;
          // Set live status based on outstanding services output
          if (api_data.api_response === null) {
            newLiveStatus = 'rescheduled' as const;
          } else if (Object.keys(api_data.api_response).length === 0) {
            newLiveStatus = 'queued' as const;
          }

          setOutstanding(api_data.api_response);
          setLiveStatus(newLiveStatus);

          // Maybe the submission completed in between two checks
          if (liveStatus !== 'processing' && newLiveStatus !== 'processing') {
            // eslint-disable-next-line no-console
            console.debug('LIVE :: Checking if the submission is completed...');
            apiCall<Submission>({
              url: `/api/v4/submission/${id}/`,
              onSuccess: submission_api_data => {
                if (submission_api_data.api_response.state === 'completed') {
                  if (loadInterval) clearInterval(loadInterval);
                  setLoadInterval(null);
                  setOutstanding(null);
                  setSubmission(parseSubmissionErrors(submission_api_data.api_response));
                }
              }
            });
          }
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTrigger]);

  useEffect(() => {
    addInsight({ type: 'report', value: id });
    addInsight({ type: 'submission', value: id });

    return () => {
      removeInsight({ type: 'report', value: id });
      removeInsight({ type: 'submission', value: id });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return currentUser.roles.includes('submission_view') ? (
    <PageCenter margin={4} width="100%">
      <ConfirmationDialog
        open={deleteDialog}
        handleClose={() => setDeleteDialog(false)}
        handleAccept={deleteSubmission}
        title={t('delete.title')}
        cancelText={t('delete.cancelText')}
        acceptText={t('delete.acceptText')}
        text={t('delete.text')}
        waiting={waitingDialog}
      />
      <ConfirmationDialog
        open={archiveDialog}
        handleClose={() => {
          setArchiveDialog(false);
          setTimeout(() => loadDefaultArchivingMetadata(), 250);
        }}
        handleAccept={archive}
        title={t('archive.title')}
        cancelText={t('archive.cancelText')}
        acceptText={t('archive.acceptText')}
        text={t('archive.text')}
        children={
          <>
            {systemConfig.core.archiver.alternate_dtl !== 0 && (
              <>
                <DialogContentText>{t('archive.alternate_expiry')}</DialogContentText>
                <Stack spacing={1}>
                  <FormControl>
                    <RadioGroup
                      value={archivingUseAlternateDtl}
                      name="alternate-expiry"
                      onChange={event => setArchivingUseAlternateDtl(event.target.value)}
                      row
                    >
                      <FormControlLabel
                        value={'false'}
                        control={<Radio />}
                        label={t('archive.alternate_expiry.never')}
                      />
                      <FormControlLabel
                        value={'true'}
                        control={<Radio />}
                        label={moment()
                          .locale(i18n.language)
                          .from(new Date().getTime() - systemConfig.core.archiver.alternate_dtl * 24 * 60 * 60 * 1000)}
                      />
                    </RadioGroup>
                  </FormControl>
                </Stack>
              </>
            )}
            {Object.keys(systemConfig.submission.metadata.archive).length !== 0 && (
              <>
                <DialogContentText>{t('archive.metadata')}</DialogContentText>
                <Stack spacing={1}>
                  {Object.entries(systemConfig.submission.metadata.archive).map(([field_name, field_cfg]) => (
                    <MetadataInputField
                      key={field_name}
                      name={field_name}
                      configuration={field_cfg}
                      value={archivingMetadata[field_name]}
                      onChange={v => {
                        let cleanMetadata = archivingMetadata;
                        if (v === undefined || v === null || v === '') {
                          // Remove field from metadata if value is null
                          delete cleanMetadata[field_name];
                        } else {
                          // Otherwise add/overwrite value
                          cleanMetadata[field_name] = v;
                        }
                        setArchivingMetadata({ ...cleanMetadata });
                      }}
                      onReset={() => {
                        let cleanMetadata = archivingMetadata;
                        delete cleanMetadata[field_name];
                        setArchivingMetadata({ ...cleanMetadata });
                      }}
                      disabled={submission ? Object.keys(submission.metadata).includes(field_name) : false}
                    />
                  ))}
                </Stack>
              </>
            )}
          </>
        }
        waiting={waitingDialog}
        unacceptable={Object.keys(systemConfig.submission.metadata.archive)
          .filter(metakey => systemConfig.submission.metadata.archive[metakey].required)
          .some(metakey => !Object.keys(archivingMetadata).includes(metakey))}
      />
      {outstanding && Object.keys(outstanding).length > 0 && (
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={outstanding !== null}
          key="outstanding"
          style={{ top: theme.spacing(8), zIndex: 100 }}
        >
          <Alert
            elevation={6}
            severity="info"
            style={{ textAlign: 'left' }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={resetOutstanding}
                style={{ alignSelf: 'start' }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <span style={{ fontWeight: 500, textAlign: 'left' }}>{t('outstanding.title')}</span>
            <Grid container style={{ marginTop: theme.spacing(1) }}>
              <Grid item xs={6}>
                <b>{t('outstanding.services')}</b>
              </Grid>
              <Grid item xs={6}>
                <b>{t('outstanding.files')}</b>
              </Grid>
            </Grid>
            {Object.keys(outstanding).map(service => (
              <Grid key={service} container>
                <Grid item xs={6}>
                  <b>{service}</b>
                </Grid>
                <Grid item xs={6}>
                  {outstanding[service]}
                </Grid>
              </Grid>
            ))}
          </Alert>
        </Snackbar>
      )}
      <div style={{ textAlign: 'left' }}>
        {c12nDef.enforce && (
          <div style={{ paddingBottom: sp4 }}>
            <Classification size="tiny" c12n={submission ? submission.classification : null} />
          </div>
        )}
        <div style={{ paddingBottom: sp4 }}>
          <Grid container>
            <Grid item xs>
              <div>
                <Typography variant="h4">{t('title')}</Typography>
                <Typography variant="caption" component={'div'}>
                  {submission ? submission.sid : <Skeleton style={{ width: '10rem' }} />}
                </Typography>
                {submission && submission.params.psid && (
                  <Typography variant="caption" component={'div'}>
                    <i>
                      <span>{t('psid')}: </span>
                      <Link
                        style={{ textDecoration: 'none', color: theme.palette.primary.main }}
                        to={`/submission/detail/${submission.params.psid}`}
                      >
                        {submission.params.psid}
                      </Link>
                    </i>
                  </Typography>
                )}
              </div>
              {socket && (
                <div
                  style={{
                    display: 'flex',
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
                    paddingBottom: theme.spacing(3),
                    paddingTop: theme.spacing(2)
                  }}
                >
                  {liveStatus === 'processing' ? (
                    <PlayCircleOutlineIcon
                      style={{
                        height: theme.spacing(3),
                        width: theme.spacing(3),
                        marginRight: theme.spacing(1)
                      }}
                    />
                  ) : (
                    <PauseCircleOutlineOutlinedIcon
                      style={{
                        height: theme.spacing(3),
                        width: theme.spacing(3),
                        marginRight: theme.spacing(1)
                      }}
                    />
                  )}
                  <div style={{ width: '100%' }}>
                    {t(liveStatus)}
                    <LinearProgress />
                  </div>
                </div>
              )}
            </Grid>
            <Grid item xs={12} sm={12} md={4} style={{ display: 'flex', justifyContent: 'flex-end', flexGrow: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {submission ? (
                  submission.state === 'completed' ? (
                    <div style={{ display: 'flex' }}>
                      {currentUser.roles.includes('submission_delete') && (
                        <Tooltip title={t('delete')}>
                          <IconButton
                            onClick={() => setDeleteDialog(true)}
                            style={{
                              color:
                                theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark
                            }}
                            size="large"
                          >
                            <RemoveCircleOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {currentUser.roles.includes('bundle_download') && (
                        <FileDownloader
                          icon={<CloudDownloadOutlinedIcon />}
                          link={`/api/v4/bundle/${submission.sid}/`}
                          tooltip={t('download')}
                        />
                      )}
                      {systemConfig.datastore.archive.enabled && currentUser.roles.includes('archive_trigger') && (
                        <Tooltip title={t(submission.archived || submission.from_archive ? 'archived' : 'archive')}>
                          <div>
                            <IconButton
                              onClick={() => setArchiveDialog(true)}
                              disabled={submission.archived || submission.from_archive}
                              size="large"
                            >
                              <ArchiveOutlinedIcon />
                            </IconButton>
                          </div>
                        </Tooltip>
                      )}
                      {currentUser.roles.includes('submission_create') && (
                        <>
                          <Tooltip title={t('resubmit')}>
                            <IconButton onClick={event => setResubmitAnchor(event.currentTarget)} size="large">
                              <ReplayOutlinedIcon />
                              {popoverOpen ? (
                                <ExpandLessIcon
                                  style={{ position: 'absolute', right: 0, bottom: 10, fontSize: 'medium' }}
                                />
                              ) : (
                                <ExpandMoreIcon
                                  style={{ position: 'absolute', right: 0, bottom: 10, fontSize: 'medium' }}
                                />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Popover
                            open={popoverOpen}
                            anchorEl={resubmitAnchor}
                            onClose={() => setResubmitAnchor(null)}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'right'
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'right'
                            }}
                          >
                            <List disablePadding>
                              <ListItem
                                button
                                component={Link}
                                to="/submit"
                                state={{
                                  hash: submission.files[0].sha256,
                                  tabContext: '1',
                                  c12n: submission.classification,
                                  metadata: submission.metadata
                                }}
                                dense
                                onClick={() => setResubmitAnchor(null)}
                              >
                                <ListItemIcon style={{ minWidth: theme.spacing(4.5) }}>
                                  <TuneOutlinedIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('resubmit.modify')} />
                              </ListItem>
                              <ListItem button dense onClick={resubmitDynamic}>
                                <ListItemIcon style={{ minWidth: theme.spacing(4.5) }}>
                                  <OndemandVideoOutlinedIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('resubmit.dynamic')} />
                              </ListItem>
                              <ListItem button dense onClick={resubmit}>
                                <ListItemIcon style={{ minWidth: theme.spacing(4.5) }}>
                                  <RepeatOutlinedIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('resubmit.carbon_copy')} />
                              </ListItem>
                            </List>
                          </Popover>
                        </>
                      )}
                      {systemConfig.ui.allow_replay && currentUser.roles.includes('replay_trigger') && (
                        <Tooltip title={t('replay')}>
                          <IconButton onClick={replay} disabled={!!submission.metadata.replay} size="large">
                            <PublishOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('report_view')}>
                        <IconButton component={Link} to={`/submission/report/${submission.sid}`} size="large">
                          <ChromeReaderModeOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </div>
                  ) : (
                    currentUser.roles.includes('submission_delete') && (
                      <Tooltip title={t('delete')}>
                        <IconButton
                          onClick={() => setDeleteDialog(true)}
                          style={{
                            color: theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark
                          }}
                          size="large"
                        >
                          <RemoveCircleOutlineOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  )
                ) : (
                  <div style={{ display: 'inline-flex' }}>
                    {[...Array(systemConfig.ui.allow_replay ? 6 : 5)].map((_, i) => (
                      <Skeleton
                        key={i}
                        variant="circular"
                        height="2.5rem"
                        width="2.5rem"
                        style={{ margin: theme.spacing(0.5) }}
                      />
                    ))}
                  </div>
                )}

                {!(submission && submission.state !== 'completed') && (
                  <div
                    style={{
                      width: '164px',
                      marginTop: '8px'
                    }}
                  >
                    {submission ? (
                      submission.state === 'completed' && (
                        <>
                          <VerdictBar verdicts={submission.verdict} />
                          {currentUser.roles.includes('submission_manage') && (
                            <Grid container>
                              <Grid item xs={5} style={{ textAlign: 'left' }}>
                                <Tooltip
                                  title={t(
                                    `verdict.${
                                      submission.verdict.malicious.indexOf(currentUser.username) !== -1 ? 'is' : 'set'
                                    }.malicious`
                                  )}
                                >
                                  <IconButton size="small" onClick={() => setVerdict('malicious')}>
                                    <BugReportOutlinedIcon
                                      style={{
                                        color:
                                          submission.verdict.malicious.indexOf(currentUser.username) !== -1
                                            ? theme.palette.error.dark
                                            : null
                                      }}
                                    />
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                              <Grid item xs={2} />
                              <Grid item xs={5} style={{ textAlign: 'right' }}>
                                <Tooltip
                                  title={t(
                                    `verdict.${
                                      submission.verdict.non_malicious.indexOf(currentUser.username) !== -1
                                        ? 'is'
                                        : 'set'
                                    }.non_malicious`
                                  )}
                                >
                                  <IconButton size="small" onClick={() => setVerdict('non_malicious')}>
                                    <VerifiedUserOutlinedIcon
                                      style={{
                                        color:
                                          submission.verdict.non_malicious.indexOf(currentUser.username) !== -1
                                            ? theme.palette.success.dark
                                            : null
                                      }}
                                    />
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          )}
                        </>
                      )
                    ) : (
                      <>
                        <Skeleton variant="rectangular" style={{ height: '15px', width: '100%' }} />
                        <div style={{ display: 'inline-flex', width: '100%', justifyContent: 'space-between' }}>
                          <Skeleton
                            variant="circular"
                            height="1.5rem"
                            width="1.5rem"
                            style={{ margin: theme.spacing(0.5) }}
                          />
                          <Skeleton
                            variant="circular"
                            height="1.5rem"
                            width="1.5rem"
                            style={{ margin: theme.spacing(0.5) }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Grid>
          </Grid>
        </div>

        <InfoSection submission={submission} />

        {filtered && (
          <div style={{ paddingBottom: theme.spacing(2), paddingTop: theme.spacing(2) }}>
            <Typography variant="subtitle1">
              <b>**{t('warning')}</b>: {t('warning.text')}
            </Typography>
          </div>
        )}

        {partial && (
          <div style={{ paddingBottom: theme.spacing(2), paddingTop: theme.spacing(2) }}>
            <Typography variant="subtitle1">
              <b>**{t('warning')}</b>: {t('warning.partial')}
            </Typography>
          </div>
        )}

        <MetaSection
          metadata={submission ? submission.metadata : null}
          classification={submission ? submission.classification : null}
        />
        {systemConfig.ui.ai.enabled && settings.executive_summary && submission && submission.state === 'completed' && (
          <AISummarySection type={'submission' as const} id={submission.sid} />
        )}
        <Detection
          section_map={summary ? summary.heuristic_sections : null}
          heuristics={summary ? summary.heuristics : null}
          force={submission && submission.max_score < 0}
        />
        <AttackSection
          attack_matrix={summary ? summary.attack_matrix : null}
          force={submission && submission.max_score < 0}
        />

        {summary &&
          Object.keys(summary.tags).length !== 0 &&
          Object.keys(summary.tags).map(
            (tag_group, group_idx) =>
              Object.keys(summary.tags[tag_group]).length !== 0 && (
                <TagSection
                  key={group_idx}
                  tag_group={tag_group}
                  tags={summary.tags[tag_group]}
                  force={submission && submission.max_score < 0}
                />
              )
          )}

        {submission && submission.state === 'completed' && Object.keys(submission.errors).length !== 0 && (
          <ErrorSection sid={id} errors={submission.errors} />
        )}

        {submission && submission.state !== 'completed' && liveErrorKeys.length !== 0 && liveErrors !== null && (
          <ErrorSection sid={id} errors={liveErrors} />
        )}

        <FileTreeSection tree={tree} sid={id} baseFiles={baseFiles} force={submission && submission.max_score < 0} />
      </div>
    </PageCenter>
  ) : (
    <ForbiddenPage />
  );
}

const SubmissionDetail = React.memo(WrappedSubmissionDetail);
export default SubmissionDetail;
