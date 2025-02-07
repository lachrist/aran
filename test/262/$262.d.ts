import { Context } from "node:vm";

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
    log: (message: string) => void;
    dir: (value: unknown, depth?: number) => void;
    signalNegative: (cause: string) => Error;
  };
};
