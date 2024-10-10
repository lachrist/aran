import type { RootSort } from "../../sort";

export type ProgramScope = {
  root: RootSort;
  eval: boolean;
};

export type ReadImportOperation = {
  type: "read-import";
};

export type ReadImportMetaOperation = {
  type: "read-import-meta";
};
