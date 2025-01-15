import type { HarnessName, TestPath } from "./fetch";
import type { Negative } from "./metadata";

export type Directive = "none" | "use-strict";

export type TestCase = {
  kind: "module" | "script";
  path: TestPath;
  content: string;
  directive: Directive;
  negative: null | Negative;
  asynchronous: boolean;
  includes: HarnessName[];
  features: string[];
};
