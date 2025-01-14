import type { Context } from "node:vm";
import type { ErrorSerial } from "./error-serial";
import type { Outcome } from "./outcome";
import type { Source } from "./source";
import type { Metadata } from "./test262";
import type { MainPath } from "./fetch";
import type { Selection } from "./selection";
import type { Tag } from "./tag";

export type StageName =
  | "identity"
  | "parsing"
  | "bare-min"
  | "bare-basic-standard"
  | "bare-basic-flexible"
  | "bare-patch-flexible"
  | "bare-patch-standard"
  | "bare-weave-flexible"
  | "bare-weave-standard"
  | "full-basic-standard"
  | "full-basic-flexible"
  | "track-origin";

export type File = {
  path: string;
  content: string;
};

export type Instrument = (source: Source) => File;

export type ListLateNegative = (
  path: MainPath,
  metadata: Metadata,
  error: ErrorSerial,
) => string[];

export type Stage = {
  setup: (context: Context) => void;
  instrument: (source: Source) => File;
  listLateNegative: ListLateNegative;
  precursor: StageName[];
  exclude: Tag[];
  negative: Tag[];
};

export type RecordingEntry<X> = [Selection, X];

export type Recording<X> = RecordingEntry<X>[];

export type Exclusion = Recording<Tag | StageName>;

export type Negation = Recording<Tag>;

export type ReadyStage = {
  setup: (context: Context) => void;
  instrument: Instrument;
  listLateNegative: ListLateNegative;
  listExclusionReason: (path: MainPath) => (Tag | StageName)[];
  listNegative: (path: MainPath) => Tag[];
};
