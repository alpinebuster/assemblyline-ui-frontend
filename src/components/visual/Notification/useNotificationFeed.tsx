import { useCallback, useMemo } from 'react';

/**
 * JSON Feed Version 1.1
 * https://www.jsonfeed.org/
 */

export type JSONFeedItemAttachment = {
  url: string;
  mime_type: string;
  title?: string;
  size_in_bytes?: number;
  duration_in_seconds?: number;
};

export type JSONFeedAuthor = {
  name?: string;
  url?: string;
  avatar?: string;
};

export type JSONFeedItem = {
  id: string;
  url?: string;
  external_url?: string;
  title?: string;
  content_html?: string;
  content_text?: string;
  content_md?: string;
  summary?: string;
  image?: string;
  banner_image?: string;
  date_published?: string;
  date_modified?: string;
  authors?: JSONFeedAuthor[];
  tags?: ('new' | 'current' | 'dev' | 'service' | 'blog' | 'community')[];
  language?: string;
  attachments?: JSONFeedItemAttachment[];
  _isNew: boolean;
};

export type JSONFeed = {
  version: string;
  title: string;
  home_page_url?: string;
  feed_url?: string;
  description?: string;
  user_comment?: string;
  next_url?: string;
  icon?: string;
  favicon?: string;
  authors?: JSONFeedAuthor[];
  language?: string;
  expired?: boolean;
  hubs?: { type: string; url: string }[];
  items: JSONFeedItem[];
};

type FetchJSONProps = {
  urls: string[];
  onSuccess?: (feeds: JSONFeedItem[]) => void;
  onError?: (err: any) => void;
};

export type UseNotificationFeedReturn = {
  fetchJSONFeeds: (urls?: string[]) => Promise<JSONFeed[]>;
  fetchJSONNotifications: ({ urls, onSuccess, onError }: FetchJSONProps) => void;
};

export const useNotificationFeed = (): UseNotificationFeedReturn => {
  const DEFAULT_JSON_FEED_ITEM_ATTACHMENT = useMemo<JSONFeedItemAttachment>(
    () => ({
      url: null,
      mime_type: null,
      title: null,
      size_in_bytes: 0,
      duration_in_seconds: 0
    }),
    []
  );

  const DEFAULT_JSON_FEED_AUTHOR = useMemo<JSONFeedAuthor>(
    () => ({
      name: null,
      url: null,
      avatar: null
    }),
    []
  );

  const DEFAULT_JSON_FEED_ITEM = useMemo<JSONFeedItem>(
    () => ({
      id: null,
      url: null,
      external_url: null,
      title: null,
      content_html: null,
      content_text: null,
      summary: null,
      image: null,
      banner_image: null,
      date_published: null,
      date_modified: null,
      authors: [],
      tags: [],
      language: null,
      attachments: [],
      _isNew: false
    }),
    []
  );

  const DEFAULT_JSON_FEED = useMemo<JSONFeed>(
    () => ({
      version: null,
      title: null,
      home_page_url: null,
      feed_url: null,
      description: null,
      user_comment: null,
      next_url: null,
      icon: null,
      favicon: null,
      authors: [],
      language: null,
      expired: false,
      hubs: [],
      items: []
    }),
    []
  );

  const decodeHTML = useCallback((html: string) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }, []);

  const parseJSONFeedItemAttachment = useCallback(
    (attachments: any[]): JSONFeedItemAttachment[] =>
      !attachments ? [] : attachments.map(attachment => ({ ...DEFAULT_JSON_FEED_ITEM_ATTACHMENT, ...attachment })),
    [DEFAULT_JSON_FEED_ITEM_ATTACHMENT]
  );

  const parseJSONFeedAuthor = useCallback(
    (authors: any[]): JSONFeedAuthor[] =>
      !authors ? [] : authors.map(author => ({ ...DEFAULT_JSON_FEED_AUTHOR, ...author })),
    [DEFAULT_JSON_FEED_AUTHOR]
  );

  const parseJSONFeedItem = useCallback(
    (items: any[]) =>
      !items
        ? []
        : items.map(item => ({
            ...DEFAULT_JSON_FEED_ITEM,
            ...item,
            date_published: new Date(item.date_published),
            date_modified: new Date(item.date_modified),
            authors: parseJSONFeedAuthor(item?.authors),
            attachments: parseJSONFeedItemAttachment(item?.attachment),
            content_html: decodeHTML(item?.content_html)
          })),
    [DEFAULT_JSON_FEED_ITEM, decodeHTML, parseJSONFeedAuthor, parseJSONFeedItemAttachment]
  );

  const parseJSONFeed = useCallback(
    (feed: any): JSONFeed =>
      !feed
        ? null
        : {
            ...DEFAULT_JSON_FEED,
            ...feed,
            items: parseJSONFeedItem(feed?.items),
            authors: parseJSONFeedAuthor(feed?.authors)
          },
    [DEFAULT_JSON_FEED, parseJSONFeedAuthor, parseJSONFeedItem]
  );

  const fetchJSON = useCallback(
    (url: string): Promise<any> =>
      new Promise(async (resolve, reject) => {
        const response: Response = (await fetch(url, { method: 'GET' }).catch(err =>
          // eslint-disable-next-line no-console
          console.error(`Notification Area: error caused by URL "${err}`)
        )) as Response;

        if (!response) {
          resolve({ ...DEFAULT_JSON_FEED });
          return;
        }

        const textResponse: string = await response.text();
        const jsonFeed = JSON.parse(textResponse) as unknown;
        resolve(parseJSONFeed(jsonFeed));
        return;
      }),
    [DEFAULT_JSON_FEED, parseJSONFeed]
  );

  const fetchJSONFeeds = useCallback(
    (urls: string[] = []): Promise<JSONFeed[]> =>
      new Promise(async (resolve, reject) => {
        if (!urls) {
          reject('no urls');
          return;
        }
        const feeds: JSONFeed[] = (await Promise.all(urls.map(url => fetchJSON(url))).catch(err =>
          reject(err)
        )) as JSONFeed[];
        resolve(feeds);
      }),
    [fetchJSON]
  );

  const fetchJSONNotifications = useCallback(
    ({ urls, onSuccess = null, onError = null }: FetchJSONProps): void => {
      fetchJSONFeeds(urls)
        .then(feeds => onSuccess && onSuccess(feeds.flatMap(f => f.items)))
        .catch(err => onError && onError(err));
    },
    [fetchJSONFeeds]
  );

  return { fetchJSONFeeds, fetchJSONNotifications };
};
