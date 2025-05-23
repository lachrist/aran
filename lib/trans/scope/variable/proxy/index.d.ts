// This frame is only used to create the self binding of expression class.
// We cannot use regular frames because it is in an expression context:
// `(class c extends console.log(c) {})`
// This seems like a lot of code to support such a small feature.
// But, having a fake frame makes sense and could be useful in the future.

import type { VariableName } from "estree-sentry";
import type { WritableCache } from "../../../cache.d.ts";
import type { Kind } from "../../../annotation/hoisting.d.ts";

export type SelfKind = Kind &
  ("function-self-sloppy" | "function-self-strict" | "class-self");

export type Write = "report" | "ignore" | "perform";

export type Status = "live" | "dead" | "schrodinger";

export type Binding = {
  status: Status;
  duplicable: boolean;
  write: Write;
  proxy: WritableCache;
};

export type ProxyFrame = {
  type: "proxy";
  record: { [key in VariableName]?: Binding };
};

export type RawProxyFrame = {
  bindings: [VariableName, { proxy: WritableCache; kind: SelfKind }][];
};
