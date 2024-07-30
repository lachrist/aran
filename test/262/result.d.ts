import type { StacklessErrorSerial } from "./error-serial";

export type ExcludeResult = {
  type: "exclude";
  path: string;
  tags: string[];
};

export type IncludeResult = {
  type: "include";
  path: string;
  expect: null | string[];
  actual: null | StacklessErrorSerial;
};

export type Result = ExcludeResult | IncludeResult;

export type TruePositiveResult = IncludeResult & {
  expect: null;
  actual: null;
};

export type FalsePositive = IncludeResult & {
  expect: null;
  actual: StacklessErrorSerial;
};

export type FalseNegative = IncludeResult & {
  expect: string[];
  actual: null;
};

export type TrueNegative = IncludeResult & {
  expect: string[];
  actual: StacklessErrorSerial;
};
