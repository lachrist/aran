import { Context } from "node:vm";
import { Status } from "./negative";

export type Flag =
  | "onlyStrict"
  | "noStrict"
  | "module"
  | "raw"
  | "async"
  | "generated"
  | "CanBlockIsFalse"
  | "CanBlockIsTrue"
  | "non-deterministic";

type Phase = "async" | "harness" | "parse" | "resolution" | "runtime";

type Negative = {
  phase: Phase;
  type: string;
};

export type Metadata = {
  negative: null | Negative;
  includes: string[];
  flags: Flag[];
  locale: string[];
  features: string[];
};

export type Agent = {
  start: () => void;
  broadcast: (buffer: SharedArrayBuffer, number: number | BigInt) => {};
  getReport: (name: string) => null | string;
  sleep: (ms: number) => void;
  monotonicNow: () => number;
};

export type $262 = {
  createRealm: () => $262;
  detachArrayBuffer: (arrayBuffer: ArrayBuffer) => void;
  evalScript: (code: string) => unknown;
  gc: () => void;
  global: object;
  IsHTMLDDA: object;
  agent: Agent;
};

export type Source = {
  kind: "script" | "module";
  url: URL;
  content: string;
};

export type Case = {
  source: Source;
  negative: null | Negative;
  asynchronous: boolean;
  includes: URL[];
};

type ErrorSerial = {
  name: string;
  message: string;
  stack?: string;
};

export type SuccessOutcome = { type: "success"; data: null };

export type BaseFailureOutcome = {
  type: "failure-base";
  data: ErrorSerial;
};

export type MetaFailureOutcome = {
  type: "failure-meta";
  data: string[];
};

export type FailureOutcome = BaseFailureOutcome | MetaFailureOutcome;

export type Outcome = SuccessOutcome | FailureOutcome;

export type Result = {
  target: string;
  metadata: Metadata;
  outcome: Outcome;
};

export type BaseFailureResult = Result & { outcome: BaseFailureOutcome };

export type Failure = {
  target: string;
  causes: string[];
};

export type Instrument = (source: Source) => Source;

export type StageName =
  | "identity"
  | "parsing"
  | "empty-native"
  | "empty-emulate"
  | "transparent-native"
  | "transparent-emulate";

export type CompileInstrument = (options: {
  record: Instrument;
  reject: (reason: string) => void;
  warning: "console" | "ignore";
  context: Context;
}) => Instrument;

export type Stage = (argv: string[]) => Promise<{
  compileInstrument: CompileInstrument;
  isExcluded: (target: string) => boolean;
  predictStatus: (target: string) => Status;
  listCause: (result: BaseFailureResult) => string[];
}>;
