import type { VariableName } from "estree-sentry";
import type { Cache } from "../../../cache.d.ts";

export type EvalFrame = {
  type: "eval";
  permanent: { [key in VariableName]?: null };
  record: Cache;
};

export type RawEvalFrame = {
  variables: VariableName[];
};
