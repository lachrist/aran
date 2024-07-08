// This frame is only used to create the self binding of a class.
// And this use case does not use the setupFrame function.
// This seems like a lot of code to support seach a small feature.
// On the other hand, having a fake frame makes sense and could
// be useful in the future.

import type { Variable } from "../../../estree";
import type { WritableCache } from "../../cache";

export type Binding = {
  baseline: "live" | "dead";
  write: "report" | "perform" | "ignore";
  proxy: WritableCache;
};

export type FakeFrame = {
  type: "fake";
  record: { [k in Variable]?: Binding };
};
