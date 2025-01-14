import { ErrorSerial } from "./error-serial";
import type { MainPath } from "./fetch";

export type ResultEntry = [MainPath, Result];

export type Result = ExcludeResult | IncludeResult;

export type ExcludeResult = {
  type: "exclude";
  data: string[];
};

export type IncludeResult = {
  type: "include";
  data: Execution[];
};

export type Execution = {
  directive: "none" | "use-strict";
  actual: null | ErrorSerial;
  expect: string[];
  time: Time;
};

export type Time = {
  user: number;
  system: number;
};

export type CompactExecution = [
  "none" | "use-strict",
  null | string,
  number,
  number,
  ...string[],
];

export type IncludeCompactResult = [MainPath, "in", ...CompactExecution[]];

export type ExcludeCompactResult = [MainPath, "ex", ...string[]];

export type CompactResultEntry = IncludeCompactResult | ExcludeCompactResult;
