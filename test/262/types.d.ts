export type Outcome<V, E> =
  | {
      type: "success";
      value: V;
    }
  | {
      type: "failure";
      error: E;
    };

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

export type Metadata = {
  negative: null | {
    phase: "parse" | "resolution" | "runtime";
    type: string;
  };
  includes: string[];
  flags: Flag[];
  locale: string[];
  features: string[];
};

export type $262 = {
  createRealm: () => $262;
  detachArrayBuffer: (arrayBuffer: ArrayBuffer) => void;
  evalScript: (code: string) => unknown;
  gc: () => void;
  global: object;
  IsHTMLDDA: object;
  agent: {
    start: () => void;
    broadcast: (buffer: SharedArrayBuffer, number: number | BigInt) => {};
    getReport: (name: string) => null | string;
    sleep: (ms: number) => void;
    monotonicNow: () => number;
  };
};

export type Case = {
  url: URL;
  content: string;
  asynchronous: boolean;
  includes: URL[];
  module: boolean;
};

export type RealmFeature = "gc" | "agent" | "isHTMLDDA" | "detachArrayBuffer";

export type Error =
  | {
      type: "metadata";
      message: string;
    }
  | {
      type: "async";
      message: string;
    }
  | {
      type: "realm";
      feature: RealmFeature;
    }
  | {
      type: "inspect";
      message: string;
    }
  | {
      type: "negative";
    }
  | {
      type: "harness" | "runtime" | "parse" | "resolution";
      name: string;
      message: string;
      stack?: string;
    }
  | {
      type: "instrumentation";
      severity: "suppress" | "warning" | "error";
      name: string;
      message: string;
    };

export type Result = {
  target: string;
  features: string[];
  errors: Error[];
};

export type Failure = {
  target: string;
  features: string[];
  errors: [Error, ...Error[]];
};

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

export type Filtering = [string, (result: Result) => boolean][];

export type Stage = {
  exclusion: string[];
  filtering: Filtering;
  makeInstrumenter: (errors: Error[]) => Instrumenter;
};

export as namespace test262;
