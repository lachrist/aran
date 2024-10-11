import type { RootSort } from "../../sort";

export type ProgramScope = {
  root: RootSort;
  program: "root" | "deep";
};

export type ReadImportOperation = {};

export type ReadImportMetaOperation = {};
