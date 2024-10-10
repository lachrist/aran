// This frame is only used to create the self binding of expression class.
// We cannot use regular frames because it is in an expression context:
// `(class c extends console.log(c) {})`
// This seems like a lot of code to support such a small feature.
// But, having a fake frame makes sense and could be useful in the future.

import type { VariableName } from "estree-sentry";
import type { WritableCache } from "../../../cache";

export type Binding = {
  initialization: "yes" | "no";
  write: "report" | "perform" | "ignore";
  proxy: WritableCache;
};

export type FakeFrame = {
  type: "fake";
  record: { [k in VariableName]?: Binding };
};
