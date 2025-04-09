import type { ErrorSerial } from "./util/error-serial.d.ts";
import type { TestPath } from "./fetch.d.ts";
import type { Directive } from "./test-case.d.ts";

export type TestSpecifier = `${TestPath}@${Directive}`;

export type Result = ExcludeResult | IncludeResult;

export type ExcludeResult = {
  type: "exclude";
  reasons: string[];
};

export type IncludeResult = {
  type: "include";
  actual: null | ErrorSerial;
  expect: string[];
  time: Time;
};

export type Time = {
  user: number;
  system: number;
};

export type IncludeCompactResult = [
  "in",
  null | string,
  number,
  number,
  ...string[],
];

export type ExcludeCompactResult = ["ex", ...string[]];

export type CompactResult = IncludeCompactResult | ExcludeCompactResult;
