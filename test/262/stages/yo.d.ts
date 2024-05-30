import type { Label, Variable } from "../../../type/aran.d.ts";
import type { Advice as GenericAdvice } from "../../../lib/weave/systematic/advice.js";

export type { Parameter, Label, Variable } from "../../../type/aran.d.ts";

export type Value = Brand<unknown, "Value">;

export type Frame = { [K in Variable | aran.Parameter]: Value };

export type Scope = Frame[];

export type Closure = {
  kind: "arrow" | "function";
  asynchronous: boolean;
  generator: boolean;
  scope: Scope;
};

export type Abrupt =
  | {
      type: "break";
      label: Label;
    }
  | {
      type: "return";
      result: Value;
    }
  | {
      type: "throw";
      error: Value;
    }
  | {
      type: "none";
    };

export type InternalCall = {
  type: "internal";
  abrupt: Abrupt;
  scope: Scope;
  stack: Value[];
};

export type ExternalCall = {
  type: "external";
};

export type Call = InternalCall | ExternalCall;

export type Callstack = Call[];

export type Advice<P extends Json[]> = GenericAdvice<Value, InternalCall, P>;
