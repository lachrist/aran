export type MatcherItem =
  | string
  | { exact: string; flaky: boolean }
  | { pattern: string; flaky: boolean };

export type Matcher = MatcherItem[];

export type MatcherEntry = [string, Matcher];
