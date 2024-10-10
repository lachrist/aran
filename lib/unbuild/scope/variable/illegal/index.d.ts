import type { VariableName } from "estree-sentry";

export type IllegalFrame = {
  type: "illegal";
  record: { [k in VariableName]?: string };
};
