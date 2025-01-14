import type { Context } from "node:vm";
import type { ErrorSerial } from "./error-serial";
import type { Source } from "./source";
import type { Metadata } from "./test262";
import type { Tag } from "./tag";
import type { MainPath } from "./fetch";
import type { Directive } from "./test-case";
import { TestSpecifier } from "./result";

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
  specifier: TestSpecifier,
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

export type ReadyStage = {
  setup: (context: Context) => void;
  instrument: Instrument;
  listLateNegative: ListLateNegative;
  listExclusionReason: (specifier: TestSpecifier) => (Tag | StageName)[];
  listNegative: (specifier: TestSpecifier) => Tag[];
};
