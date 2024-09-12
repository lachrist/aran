import { Context } from "node:vm";
import { Report } from "./report";

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
  aran: {
    context: Context;
    log: Console["log"];
    dir: Console["dir"];
    report: Report;
    instrumentEvalCode: (code: string, context: object | null) => string;
  };
};
