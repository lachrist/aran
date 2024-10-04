import type { Situ, AranIntrinsicRecord } from "../../../";
import type { Report } from "../report";

export type InstrumentLocalEvalCode = (code: string, situ: Situ) => string;

export type BasicMembrane = {
  intrinsics: AranIntrinsicRecord;
  report: Report;
  instrumentLocalEvalCode: InstrumentLocalEvalCode;
};

export type WeaveMembrane = {
  intrinsics: AranIntrinsicRecord;
  report: Report;
  instrumentLocalEvalCode: InstrumentLocalEvalCode;
  apply: (function_: unknown, this_: unknown, arguments_: unknown[]) => unknown;
  construct: (constructor: unknown, arguments_: unknown[]) => unknown;
};

export type PatchMembrane = {
  intrinsics: AranIntrinsicRecord;
  report: Report;
};
