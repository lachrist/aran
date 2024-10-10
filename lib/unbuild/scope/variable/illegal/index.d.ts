import type { VariableName } from "estree-sentry";

export type IllegalFrame = {
  type: "illegal";
  record: { [key in VariableName]?: string };
};
