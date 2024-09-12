import type { DeepLocalSitu, IntrinsicRecord, Path } from "../../../lib";
import { Report } from "../report";

export type InstrumentLocalEvalCode = (
  code: string,
  path: Path,
  situ: DeepLocalSitu,
) => string;

export type BasicMembrane = {
  intrinsics: IntrinsicRecord;
  report: Report;
  instrumentLocalEvalCode: InstrumentLocalEvalCode;
};

export type WeaveMembrane = {
  intrinsics: IntrinsicRecord;
  report: Report;
  instrumentLocalEvalCode: InstrumentLocalEvalCode;
  apply: (function_: unknown, this_: unknown, arguments_: unknown[]) => unknown;
  construct: (constructor: unknown, arguments_: unknown[]) => unknown;
};

export type PatchMembrane = {
  intrinsics: IntrinsicRecord;
  report: Report;
};
