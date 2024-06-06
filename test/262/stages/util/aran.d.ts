import { IntrinsicRecord } from "../../../../lib";
import { Instrument } from "../../types";

export type Instrumentation = {
  intrinsic: IntrinsicRecord;
  instrumentRoot: Instrument;
  instrumentDeep: (
    code: string,
    context: null | import("../../../../lib/source").DeepLocalContext,
    path: null | import("../../../../lib").Path,
  ) => string;
};
