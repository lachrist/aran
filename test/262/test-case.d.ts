import type { HarnessName, TestPath } from "./fetch";
import type { Feature, Negative } from "./metadata";

export type Directive = "none" | "use-strict";

type Kind = "module" | "script";

type Asynchronous = boolean;

export type TestCase = {
  kind: Kind;
  path: TestPath;
  directive: Directive;
  negative: null | Negative;
  asynchronous: Asynchronous;
  includes: HarnessName[];
  features: Feature[];
};

export type CompactTestCase = [
  Kind,
  TestPath,
  Directive,
  null | Negative,
  Asynchronous,
  HarnessName[],
  Feature[],
];
