import type { Context } from "node:vm";
import type { ErrorSerial } from "../util/error-serial";
import type { Source } from "../source";
import type { Tag } from "../tagging/tag";
import type { TestSpecifier } from "../result";
import type { StageName } from "./stage-name";
import type { TestCase } from "../test-case";
import type { File } from "../util/file";

export type Instrument = (source: Source) => File;

export type Setup = (context: Context) => void;

export type ListLateNegative = (
  test_case: TestCase,
  error: ErrorSerial,
) => string[];

export type Stage = {
  setup: Setup;
  instrument: Instrument;
  listLateNegative: ListLateNegative;
  precursor: StageName[];
  exclude: Tag[];
  negative: Tag[];
};

export type ReadyStage = {
  setup: Setup;
  instrument: Instrument;
  listLateNegative: ListLateNegative;
  listExclusionReason: (specifier: TestSpecifier) => (Tag | StageName)[];
  listNegative: (specifier: TestSpecifier) => Tag[];
};
