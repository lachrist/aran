import type {
  AranLabel,
  AranVariable,
  AranParameter,
  ControlKind,
  ProgramKind,
} from "../../lib";
import { RoutineKind } from "../../lib/weave/parametrization";
import { NodeHash } from "../262/aran/config";

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
      "type": "arrow" | "async-arrow";
      "function.callee": ClosureValue;
      "function.arguments": Value[];
    }
  | {
      "type":
        | "function"
        | "async-function"
        | "generator"
        | "async-generator"
        | "method"
        | "async-method";
      "function.callee": ClosureValue;
      "new.target": Value;
      "this": Value;
      "function.arguments": Value[];
    };

export type Frame = {
  labels: AranLabel[];
  record: {
    [key in AranVariable | AranParameter]: Value;
  };
};

export type Scope = { [key in AranVariable | AranParameter]?: Value };

export type Transit =
  | {
      type: "regular";
    }
  | {
      type: "external";
    }
  | {
      type: "eval";
    }
  | {
      type: "completion";
    }
  | {
      type: "await";
    }
  | {
      type: "yield";
    }
  | {
      type: "return";
      result: Value;
    }
  | {
      type: "return-unknown";
    }
  | {
      type: "break";
      label: AranLabel;
    }
  | {
      type: "apply";
      callee: Value;
      this: Value;
      arguments: Value[];
    }
  | {
      type: "construct";
      callee: Value;
      arguments: Value[];
    }
  | {
      type: "throw";
      error: Value;
    };

export type Suspension = "none" | "eval" | "yield" | "await";

export type State = null | {
  parent: State;
  kind: ProgramKind | RoutineKind | ControlKind;
  hash: NodeHash;
  origin: Transit;
  labeling: AranLabel[];
  scope: Scope;
  stack: Value[];
  suspension: Suspension;
};
