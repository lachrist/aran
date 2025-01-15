import type { Context } from "node:vm";
import type { ErrorSerial } from "../util/error-serial";
import type { Source } from "../source";
import type { Metadata } from "../test262";
import type { Tag } from "../tagging/tag";
import type { TestSpecifier } from "../result";
import { StageName } from "./stage-name";

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
