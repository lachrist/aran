import { ErrorSerial } from "./error-serial";

export type ExcludeResult = {
  type: "exclude";
  path: string;
  reasons: string[];
};

export type IncludeResult = {
  type: "include";
  path: string;
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
