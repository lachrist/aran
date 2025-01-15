import type { ErrorSerial } from "../util/error-serial";
import type { HarnessName } from "../fetch";
import type { MainSource } from "../source";
import type { Metadata, Negative } from "../test262";

export type Directive = "none" | "use-strict";

export type TestCase = {
  metadata: Metadata;
  directive: Directive;
  source: MainSource;
  negative: null | Negative;
  asynchronous: boolean;
  includes: HarnessName[];
};

export type FetchHarness = (name: string) => {
  content: string;
};

export type FetchModule = (
  name: string,
  base: string,
) => {
  base: string;
  content: string;
};

export type Termination = {
  done: Promise<null | ErrorSerial>;
  print: (message: unknown) => void;
};
