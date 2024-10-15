import type { Role } from 'components/models/base/user';

export const METHODS = ['GET', 'POST', 'DELETE', 'PUT'] as const;

export type Method = (typeof METHODS)[number];

export type Page = {
  audit: boolean;
  count_towards_quota: boolean;
  function: string;
  methods: Method[];
  protected: boolean;
  required_type: Role[];
  url: string;
};

/** Check if all pages have been protected by a login decorator */
export type SiteMap = Page[];
