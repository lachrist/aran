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
  name: string;
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

export type Case = {
  url: URL;
  content: string;
  negative: null | Negative;
  asynchronous: boolean;
  includes: URL[];
  module: boolean;
};

type ErrorSerial = {
  name: string;
  message: string;
  stack?: string;
};

export type Result = {
  target: string;
  metadata: Metadata;
  error: null | ErrorSerial;
};

export type Failure = Result & { error: ErrorSerial };

export type Instrument = (
  code: string,
  options: {
    kind: "script" | "module";
    specifier: URL | number;
  },
) => string;

export type Instrumenter = {
  globals: [string, unknown][];
  setup: string;
  instrument: Instrument;
};

export type StageName = "identity" | "parsing" | "empty-enclave";

export type Stage = {
  instrumenter: Instrumenter;
  tagFailure: (failure: Failure) => string[];
  requirement: StageName[];
};

export as namespace test262;
