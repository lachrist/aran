import type { Context } from "node:vm";
import type { Source } from "../source.d.ts";
import type { Tag } from "../tagging/tag.d.ts";
import type { StageName } from "./stage-name.d.ts";
import type { File } from "../util/file.d.ts";
import { TestCase, TestIndex } from "../test-case";

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

export type Config = { record_directory: null | URL };

export type Open<H> = (config: { record_directory: null | URL }) => Promise<H>;
export type Close<H> = (handle: H) => Promise<void>;
export type Setup<H, X> = (
  handle: H,
  entry: [TestIndex, TestCase],
) => Promise<Selector<X>>;
export type Prepare<X> = (state: X, context: Context) => void;
export type Instrument<H> = (handle: H, source: Source) => File;
export type Teardown<X> = (state: X) => Promise<void>;

export type Stage<H, X> = {
  open: Open<H>;
  close: Close<H>;
  setup: Setup<H, X>;
  prepare: Prepare<X>;
  instrument: Instrument<H>;
  teardown: Teardown<X>;
};
