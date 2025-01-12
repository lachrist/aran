import type { AranIntrinsicRecord, AranProgram } from "../../../";
import type { Report } from "../report";
import type { Atom } from "./config";

export type BasicMembrane = {
  intrinsics: AranIntrinsicRecord;
  report: Report;
  weaveLocalEval: (aran: AranProgram<Atom>) => AranProgram<Atom>;
};

export type WeaveMembrane = {
  intrinsics: AranIntrinsicRecord;
  report: Report;
  weaveLocalEval: (aran: AranProgram<Atom>) => AranProgram<Atom>;
  apply: (function_: unknown, this_: unknown, arguments_: unknown[]) => unknown;
  construct: (constructor: unknown, arguments_: unknown[]) => unknown;
};

export type PatchMembrane = {
  intrinsics: AranIntrinsicRecord;
  report: Report;
};
