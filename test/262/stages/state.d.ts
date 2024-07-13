// @ts-nocheck

import type { Label, Frame as GenericFrame } from "../../../lib";

export type {
  Parameter,
  Label,
  Variable,
  ClosureKind,
  StandardAspect as Aspect,
} from "../../../lib";

export type Value = { __brand: "Value" };

export type Valuation = {
  Stack: Value;
  Scope: Value;
  Other: Value;
};

export type ArrayValue = Value & Value[];

export type ClosureValue = Value & ((...input: Value[]) => Value);

export type ConstructorValue = Value & (new (...input: Value[]) => Value);

export type Arrival =
  | {
      type: "arrow";
      callee: ClosureValue;
      input: Value[];
    }
  | {
      type: "function";
      callee: ClosureValue;
      target: Value;
      self: Value;
      input: Value[];
    };

export type Marker =
  | { type: "setup"; labels: Label[] }
  | {
      type: "normal";
    };

export type Frame = {
  labels: Label[];
  record: GenericFrame<Value>;
};

export type Scope = Frame[];

export type Termination =
  | {
      type: "none";
    }
  | {
      type: "completion";
    }
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
    };

export type InternalCall = {
  type: "internal";
  termination: Termination;
  scope: Scope;
  stack: Value[];
};

export type ExternalCall = {
  type: "external";
};

export type Call = InternalCall | ExternalCall;
