import type { RootSort } from "../../sort.d.ts";

export type ProgramScope = {
  root: RootSort;
  program: "root" | "deep";
};

export type ReadImportOperation = {};

export type ReadImportMetaOperation = {};
