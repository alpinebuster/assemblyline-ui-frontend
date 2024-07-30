import { AppSwitcherItem } from 'commons/components/app/AppConfigs';
import { AppUser, AppUserService, AppUserValidatedProp } from 'commons/components/app/AppUserService';
import { ClassificationDefinition } from 'helpers/classificationParser';
import { useState } from 'react';

export type ALField = {
  name: string;
  indexed: boolean;
  stored: boolean;
  type: string;
  default: boolean;
  list: boolean;
};

type IndexDefinition = {
  [propName: string]: ALField;
};

type IndexDefinitionMap = {
  alert: IndexDefinition;
  badlist: IndexDefinition;
  file: IndexDefinition;
  heuristic: IndexDefinition;
  result: IndexDefinition;
  retrohunt: IndexDefinition;
  safelist: IndexDefinition;
  signature: IndexDefinition;
  submission: IndexDefinition;
  workflow: IndexDefinition;
};

type SettingsDefinition = {
  classification: string;
  deep_scan: boolean;
  description: string;
  download_encoding: string;
  executive_summary: boolean;
  expand_min_score: number;
  ignore_cache: boolean;
  ignore_dynamic_recursion_prevention: boolean;
  ignore_filtering: boolean;
  priority: number;
  profile: boolean;
  service_spec: any[];
  services: any[];
  submission_view: string;
  ttl: number;
};

export type SystemMessageDefinition = {
  user: string;
  title: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

export type ExternalLink = {
  allow_bypass: boolean;
  double_encode: boolean;
  max_classification: string;
  name: string;
  replace_pattern: string;
  url: string;
};

export type ExternalSource = {
  max_classification: string;
  name: string;
};

export type MetadataConfiguration = {
  required: boolean;
  validator_type: string;
  default: string;
  suggestions: string[];
  validator_params: {
    validation_regex?: string;
    values?: string[];
    max?: number;
    min?: number;
  };
};

export type SubmissionProfileParams = {
  auto_archive: boolean;
  deep_scan: boolean;
  delete_after_archive: boolean;
  ignore_cache: boolean;
  ignore_dynamic_recursion_prevention: boolean;
  ignore_filtering: boolean;
  ignore_size: boolean;
  max_extracted: number;
  max_supplementary: number;
  priority: number;
  service_spec: {
    [service: string]: {
      [parameter: string]: any;
    };
  };
  services: {
    excluded: string[];
    rescan: string[];
    resubmit: string[];
    selected: string[];
  };
  ttl: number;
  use_archive_alternate_dtl: boolean;
};

export type ConfigurationDefinition = {
  auth: {
    allow_2fa: boolean;
    allow_apikeys: boolean;
    allow_extended_apikeys: boolean;
    allow_security_tokens: boolean;
  };
  core: {
    archiver: {
      alternate_dtl: number;
    };
  };
  datastore: {
    archive: {
      enabled: boolean;
    };
  };
  retrohunt: {
    enabled: boolean;
    dtl: number;
    max_dtl: number;
  };
  submission: {
    dtl: number;
    max_dtl: number;
    file_sources: {
      [hash_type: string]: {
        pattern: string;
        sources: string[];
        auto_selected: string[];
      };
    };
    metadata: {
      archive: {
        [field_name: string]: MetadataConfiguration;
      };
      submit: {
        [field_name: string]: MetadataConfiguration;
      };
    };
    profiles: {
      [profile_name: string]: SubmissionProfileParams;
    };
    verdicts: {
      info: number;
      suspicious: number;
      highly_suspicious: number;
      malicious: number;
    };
  };
  system: {
    organisation: string;
    type: string;
    version: string;
  };
  ui: {
    ai: {
      enabled: boolean;
    };
    alerting_meta: {
      important: string[];
      subject: string[];
      url: string[];
    };
    allow_malicious_hinting: boolean;
    allow_raw_downloads: boolean;
    allow_replay: boolean;
    allow_url_submissions: boolean;
    allow_zip_downloads: boolean;
    apps: AppSwitcherItem[];
    banner: {
      [lang: string]: string;
    };
    banner_level: 'info' | 'warning' | 'error' | 'success';
    enforce_quota: boolean;
    external_links: {
      tag: { [key: string]: ExternalLink[] };
      hash: { [key: string]: ExternalLink[] };
      metadata: { [key: string]: ExternalLink[] };
    };
    external_sources: ExternalSource[];
    external_source_tags: {
      [tag_name: string]: string[];
    };
    fqdn: string;
    read_only: boolean;
    rss_feeds: string[];
    services_feed: string;
    community_feed: string;
    tos: boolean;
    tos_lockout: boolean;
    tos_lockout_notify: boolean;
    url_submission_auto_service_selection: string[];
  };
  user: {
    api_priv_map: {
      [api_priv: string]: string[];
    };
    priv_role_dependencies: {
      [priv: string]: string[];
    };
    roles: string[];
    role_dependencies: {
      [role: string]: string[];
    };
    types: string[];
  };
};

export interface CustomUser extends AppUser {
  // Al specific props
  agrees_with_tos: boolean;
  classification: string;
  default_view?: string;
  dynamic_group: string | null;
  groups: string[];
  is_active: boolean;
  roles: string[];
  api_daily_quota: number;
  submission_daily_quota: number;
}

export interface CustomAppUserService extends AppUserService<CustomUser> {
  c12nDef: ClassificationDefinition;
  configuration: ConfigurationDefinition;
  indexes: IndexDefinitionMap;
  settings: SettingsDefinition;
  systemMessage: SystemMessageDefinition;
  setConfiguration: (cfg: ConfigurationDefinition) => void;
  setSystemMessage: (msg: SystemMessageDefinition) => void;
  scoreToVerdict: (score: number) => string;
}

export interface WhoAmIProps extends CustomUser {
  c12nDef: ClassificationDefinition;
  configuration: ConfigurationDefinition;
  indexes: IndexDefinitionMap;
  system_message: SystemMessageDefinition;
  settings: SettingsDefinition;
}

// Application specific hook that will provide configuration to commons [useUser] hook.
export default function useMyUser(): CustomAppUserService {
  const [user, setState] = useState<CustomUser>(null);
  const [c12nDef, setC12nDef] = useState<ClassificationDefinition>(null);
  const [configuration, setConfiguration] = useState<ConfigurationDefinition>(null);
  const [indexes, setIndexes] = useState<IndexDefinitionMap>(null);
  const [systemMessage, setSystemMessage] = useState<SystemMessageDefinition>(null);
  const [settings, setSettings] = useState<SettingsDefinition>(null);
  const [flattenedProps, setFlattenedProps] = useState(null);

  function flatten(ob) {
    const toReturn = {};

    for (const i in ob) {
      if ({}.hasOwnProperty.call(ob, i)) {
        if (!Array.isArray(ob[i]) && typeof ob[i] == 'object') {
          const flatObject = flatten(ob[i]);
          for (const x in flatObject) {
            if ({}.hasOwnProperty.call(flatObject, x)) {
              toReturn[`${i}.${x}`] = flatObject[x];
            }
          }
        } else {
          toReturn[i] = ob[i];
        }
      }
    }
    return toReturn;
  }

  const setUser = (whoAmIData: WhoAmIProps) => {
    const {
      configuration: cfg,
      c12nDef: c12n,
      indexes: idx,
      system_message: msg,
      settings: userSettings,
      ...curUser
    } = whoAmIData;
    const upperC12n = {
      ...c12n,
      original_definition: {
        ...c12n.original_definition,
        groups: c12n.original_definition.groups.map(grp => ({
          ...grp,
          aliases: grp.aliases.map(val => val.toUpperCase()),
          name: grp.name.toLocaleUpperCase(),
          short_name: grp.short_name.toLocaleUpperCase()
        })),
        levels: c12n.original_definition.levels.map(lvl => ({
          ...lvl,
          aliases: lvl.aliases.map(val => val.toUpperCase()),
          name: lvl.name.toLocaleUpperCase(),
          short_name: lvl.short_name.toLocaleUpperCase()
        })),
        subgroups: c12n.original_definition.subgroups.map(sg => ({
          ...sg,
          aliases: sg.aliases.map(val => val.toUpperCase()),
          name: sg.name.toLocaleUpperCase(),
          short_name: sg.short_name.toLocaleUpperCase()
        })),
        required: c12n.original_definition.required.map(req => ({
          ...req,
          aliases: req.aliases.map(val => val.toUpperCase()),
          name: req.name.toLocaleUpperCase(),
          short_name: req.short_name.toLocaleUpperCase()
        }))
      }
    };
    setC12nDef(upperC12n);
    setConfiguration(cfg);
    setIndexes(idx);
    setSystemMessage(msg);
    setState({
      ...curUser,
      dynamic_group: curUser.email ? curUser.email.toUpperCase().split('@')[1] : null
    });
    setSettings(userSettings);
    setFlattenedProps(
      flatten({ user: curUser, c12nDef: upperC12n, configuration: cfg, indexes: idx, settings: userSettings })
    );
  };

  const validateProp = (propDef: AppUserValidatedProp) => {
    const obj = flattenedProps[propDef.prop];
    if (Array.isArray(obj)) {
      return obj.indexOf(propDef.value) !== -1;
    }
    return obj === propDef.value;
  };

  const validateProps = (props: AppUserValidatedProp[]) => {
    if (props === undefined || !Array.isArray(props)) return true;

    let enforcedProps: AppUserValidatedProp[] = [];
    let unEnforcedProps: AppUserValidatedProp[] = [];
    props.forEach(prop => (prop?.enforce ? enforcedProps.push(prop) : unEnforcedProps.push(prop)));

    const enforcedValidated = enforcedProps.length > 0 ? enforcedProps.every(validateProp) : true;
    const unEnforcedValidated = unEnforcedProps.length > 0 ? unEnforcedProps.some(validateProp) : true;

    return enforcedValidated && unEnforcedValidated;
  };

  const isReady = () => {
    if (user === null || (!user.agrees_with_tos && configuration.ui.tos) || !user.is_active) {
      return false;
    }

    return true;
  };

  const scoreToVerdict = (score: number | null) => {
    if (score >= configuration.submission.verdicts.malicious) {
      return 'malicious';
    }

    if (score >= configuration.submission.verdicts.highly_suspicious) {
      return 'highly_suspicious';
    }

    if (score >= configuration.submission.verdicts.suspicious) {
      return 'suspicious';
    }

    if (score === null || score >= configuration.submission.verdicts.info) {
      return 'info';
    }

    return 'safe';
  };

  return {
    c12nDef,
    configuration,
    indexes,
    systemMessage,
    settings,
    user,
    setUser,
    setConfiguration,
    setSystemMessage,
    isReady,
    validateProps,
    scoreToVerdict
  };
}
