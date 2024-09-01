import type { Context } from "node:vm";
import type { ErrorSerial } from "./error-serial";

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
  report: (error: Error) => void;
  warning: "console" | "ignore";
  context: Context;
}) => Instrument;

export type Stage = {
  exclude: string[];
  negative: string[];
  precursor: string[];
  compileInstrument: CompileInstrument;
  listLateNegative: (
    target: string,
    metadata: Metadata,
    error: ErrorSerial,
  ) => string[];
};
