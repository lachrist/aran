import type { Context } from "node:vm";
import type { ErrorSerial } from "./error-serial";
import type { Outcome } from "./outcome";
import type { Source } from "./source";
import type { Metadata } from "./test262";
import type { Tagging } from "./tagging";
import type { Precursor } from "./precursor";
import { TargetPath } from "./fetch";

export type StageName =
  | "identity"
  | "parsing"
  | "bare-basic-standard"
  | "bare-basic-flexible"
  | "bare-patch-flexible"
  | "bare-patch-standard"
  | "bare-weave-flexible"
  | "bare-weave-standard"
  | "full-basic-standard"
  | "full-basic-flexible"
  | "state-basic-standard";

export type InstrumentOutcome = Outcome<
  { location: string | null; content: string },
  { name: string; message: string }
>;

export type Instrument = (source: Source) => InstrumentOutcome;

export type ListLateNegative = (
  path: TargetPath,
  metadata: Metadata,
  error: ErrorSerial,
) => string[];

export type Stage = {
  setup: (context: Context) => void;
  instrument: Instrument;
  listLateNegative: ListLateNegative;
  exclude: string[];
  negative: string[];
  precursor: string[];
};

export type ReadyStage = {
  setup: (context: Context) => void;
  instrument: Instrument;
  listLateNegative: ListLateNegative;
  exclude: Tagging;
  negative: Tagging;
  precursor: Precursor;
};
