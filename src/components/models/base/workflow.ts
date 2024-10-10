export const LABELS = [
  'ATTRIBUTED',
  'CRIME',
  'FALSE_POSITIVE',
  'MITIGATED',
  'PENDING',
  'PHISHING',
  'REPORTED',
  'WHITELISTED'
] as const;
export const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const STATUSES = ['', 'MALICIOUS', 'NON-MALICIOUS', 'ASSESS', 'TRIAGE'] as const;

export type Label = (typeof LABELS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];

/** Model of Workflow */
export type Workflow = {
  /** Classification of the workflow */
  classification: string;

  /** Creation date of the workflow */
  creation_date: string & Date;

  /** UID of the creator of the workflow */
  creator: string;

  /** Priority applied by the workflow */
  description: string;

  /** UID of the last user to edit the workflow */
  edited_by: string;

  /** Is this workflow enabled? */
  enabled: boolean;

  /** Date of first hit on workflow */
  first_seen?: string & Date;

  /** Number of times there was a workflow hit */
  hit_count: number;

  /** ID of the workflow */
  id: string;

  /** Labels applied by the workflow */
  labels: string[];

  /** Date of last edit on workflow */
  last_edit: string & Date;

  /** Date of last hit on workflow */
  last_seen?: string & Date;

  /** Name of the workflow */
  name: string;

  /** Which did this originate from? */
  origin?: string;

  /**  */
  priority?: Priority;

  /** Query that the workflow runs */
  query: string;

  /** Status applied by the workflow */
  status?: Status;

  /** ID of the workflow */
  workflow_id?: string;
};

export type WorkflowIndexed = Pick<
  Workflow,
  | 'classification'
  | 'creation_date'
  | 'creator'
  | 'edited_by'
  | 'enabled'
  | 'first_seen'
  | 'hit_count'
  | 'id'
  | 'labels'
  | 'last_edit'
  | 'last_seen'
  | 'name'
  | 'origin'
  | 'priority'
  | 'query'
  | 'status'
  | 'workflow_id'
>;

export const DEFAULT_WORKFLOW: Workflow = {
  classification: '',
  creation_date: undefined,
  creator: '',
  description: '',
  edited_by: '',
  enabled: false,
  hit_count: 0,
  id: '',
  labels: [],
  last_edit: undefined,
  name: '',
  priority: '',
  query: '',
  status: ''
};
