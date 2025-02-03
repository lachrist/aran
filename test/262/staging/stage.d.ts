import type { Context } from "node:vm";
import type { Source } from "../source";
import type { Tag } from "../tagging/tag";
import type { StageName } from "./stage-name";
import type { TestCase } from "../test-case";
import type { File } from "../util/file";

export type Selector<X> =
  | {
      type: "exclude";
      reasons: (Tag | StageName)[];
    }
  | {
      type: "include";
      state: X;
      flaky: boolean;
      negatives: Tag[];
    };

export type Setup<X> = (test_case: TestCase) => Promise<Selector<X>>;
export type Prepare<X> = (state: X, context: Context) => void;
export type Instrument = (source: Source) => File;
export type Teardown<X> = (state: X) => Promise<void>;

export type Stage<X> = {
  setup: Setup<X>;
  prepare: Prepare<X>;
  instrument: Instrument;
  teardown: Teardown<X>;
};
