import type { MainPath } from "./fetch";

export type ExcludeResult = {
  type: "exclude";
  path: MainPath;
  exclusion: [string, ...string[]];
  expect: null;
  actual: null;
  time: null;
};

export type IncludeResult = {
  type: "include";
  path: MainPath;
  exclusion: [];
  expect: string[];
  actual: null | string;
  time: {
    total: {
      user: number;
      system: number;
    };
    instrument: {
      user: number;
      system: number;
    };
  };
};

export type CompactResult =
  | [MainPath, [string, ...string[]], null, null, null]
  | [MainPath, [], string[], null | string, [number, number, number, number]];

export type Result = ExcludeResult | IncludeResult;

export type TruePositiveResult = IncludeResult & {
  expect: null;
  actual: null;
};

export type FalsePositive = IncludeResult & {
  expect: null;
  actual: string;
};

export type FalseNegative = IncludeResult & {
  expect: [string, ...string[]];
  actual: null;
};

export type TrueNegative = IncludeResult & {
  expect: [string, ...string[]];
  actual: string;
};
