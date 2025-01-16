import { ErrorSerial } from "./util/error-serial";
import { TestPath } from "./fetch";
import { Directive } from "./test-case";

export type TestSpecifier = `${TestPath}@${Directive}`;

export type Result = ExcludeResult | IncludeResult;

export type ResultEntry = [TestSpecifier, Result];

export type ExcludeResult = [string, ...string[]];

export type IncludeResult = {
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

export type ExcludeCompactResult = ["ex", string, ...string[]];

export type CompactResult = IncludeCompactResult | ExcludeCompactResult;
