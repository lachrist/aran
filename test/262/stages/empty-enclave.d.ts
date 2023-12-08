export type MatcherItem =
  | string
  | { exact: string; flaky: boolean }
  | { pattern: string; flaky: boolean };

export type Matcher = MatcherItem[];

export type MatcherEntry = [string, Matcher];

export type Value = unknown;

export type Location = string;

export type Advice = import("../../../type/advice").Advice<Value, Location>;
