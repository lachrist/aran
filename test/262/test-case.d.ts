import type { ErrorSerial } from "./error-serial";
import type { HarnessName } from "./fetch";
import type { MainSource } from "./source";
import type { Negative } from "./test262";

export type Directive = "none" | "use-strict";

export type TestCase = {
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
