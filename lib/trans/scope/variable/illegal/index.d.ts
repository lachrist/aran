import type { VariableName } from "estree-sentry";

export type IllegalRecord = { [key in VariableName]?: string };

export type IllegalFrame = {
  type: "illegal";
  record: IllegalRecord;
};

export type RawIllegalFrame = {
  record: IllegalRecord;
};
