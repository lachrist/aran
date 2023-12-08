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

export type Result = {
  target: string;
  metadata: Metadata;
  error: null | ErrorSerial;
};

export type Failure = Result & { error: ErrorSerial };

export type Instrument = (source: Source) => Source;

export type Instrumenter = {
  globals: { [key in string]: PropertyDescriptor };
  setup: string[];
  instrument: Instrument;
};

export type StageName = "identity" | "parsing" | "empty-enclave";

export type Stage = {
  createInstrumenter: (options: {
    reject: (error: Error) => void;
    warning: "console" | "silent";
  }) => Instrumenter;
  expect: (result: Result) => string[];
  requirement: StageName[];
  exclusion: string[];
};

export as namespace test262;
