import { ErrorSerial } from "./error-serial";
import { TestPath } from "./fetch";
import { Directive } from "./test-case";

export type TestSpecifier = `${TestPath}@${Directive}`;
// export type TestSpecifier = string & { __brand: "TestSpecifier" };

export type ResultEntry = [TestSpecifier, Result];

export type Result = ExcludeResult | IncludeResult;

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
  TestSpecifier,
  "in",
  null | string,
  number,
  number,
  ...string[],
];

export type ExcludeCompactResult = [TestSpecifier, "ex", string, ...string[]];

export type CompactResultEntry = IncludeCompactResult | ExcludeCompactResult;
