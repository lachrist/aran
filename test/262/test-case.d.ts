import type { ErrorSerial } from "./error-serial";
import type { HarnessName } from "./fetch";
import type { Outcome } from "./outcome";
import type { RootSource } from "./source";
import type { Negative } from "./test262";

export type TestCaseOutcome = Outcome<null, ErrorSerial>;

export type TestCase = {
  source: RootSource;
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
  done: Promise<TestCaseOutcome>;
  print: (message: unknown) => void;
};
