export type MatcherItem = string | { pattern: string };

export type Matcher = MatcherItem[];

export type MatcherEntry = [string, Matcher];
