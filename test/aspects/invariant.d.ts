// @ts-nocheck

import type {
  Label,
  Frame as GenericFrame,
  Variable,
  BlockKind,
  Path,
  ProgramKind,
} from "../../lib";

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
  labels: Label[];
  record: GenericFrame<Value>;
};

export type Scope = { [key in Variable | Parameter]?: Value };

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
      label: Label;
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
  kind: BlockKind;
  path: Path;
  origin: Transit;
  labeling: Label[];
  scope: Scope;
  stack: Value[];
  suspension: Suspension;
};
