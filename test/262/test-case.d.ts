import type { HarnessName, TestPath } from "./fetch.d.ts";
import type { Feature, Negative } from "./metadata.d.ts";

export type Directive = "none" | "use-strict";

export type TestIndex = number & { __brand: "TestIndex" };

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
