import type { ErrorSerial } from "./util/error-serial";
import type { TestPath } from "./fetch";
import type { Directive } from "./test-case";
import type { Tag } from "./tagging/tag";
import type { StageName } from "./staging/stage-name";

export type TestSpecifier = `${TestPath}@${Directive}`;

export type Result = ExcludeResult | IncludeResult;

export type ResultEntry = [TestSpecifier, Result];

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

export type CompactResultEntry = [TestSpecifier, CompactResult];
