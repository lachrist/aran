import type { ErrorSerial } from "./error-serial";
import type { MainPath } from "./fetch";

export type ExcludeResult = {
  type: "exclude";
  path: MainPath;
  reasons: string[];
};

export type IncludeResult = {
  type: "include";
  path: MainPath;
  time: {
    user: number;
    system: number;
  };
  expect: null | string[];
  actual: null | ErrorSerial;
};

export type Result = ExcludeResult | IncludeResult;

export type TruePositiveResult = IncludeResult & {
  expect: null;
  actual: null;
};

export type FalsePositive = IncludeResult & {
  expect: null;
  actual: ErrorSerial;
};

export type FalseNegative = IncludeResult & {
  expect: string[];
  actual: null;
};

export type TrueNegative = IncludeResult & {
  expect: string[];
  actual: ErrorSerial;
};
