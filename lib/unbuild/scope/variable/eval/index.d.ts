import type { VariableName } from "estree-sentry";
import type { Cache } from "../../cache";

export type Binding = {
  baseline: "live" | "dead";
  write: "report" | "ignore" | "perform";
};

export type EvalFrame = {
  type: "eval";
  dynamic: Cache;
  static: { [key in VariableName]?: Binding };
};
