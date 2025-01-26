import type {
  StandardAspectKind,
  Parameter,
  ControlKind,
  StandardAdvice,
} from "aran";

export type NodeHash = string & { __brand: "NodeHash" };
export type FilePath = string & { __brand: "FilePath" };
export type Source = string & { __brand: "Source" };
export type Specifier = string & { __brand: "Specifier" };
export type Label = string & { __brand: "Label" };
export type Variable = string & { __brand: "Variable" };
export type Value = { __brand: "Value" };

export type Identifier = Variable | Parameter;

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
  record: {
    [key in Identifier]: Value;
  };
};

export type Scope = { [key in Identifier]?: Value };

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

export type State = {
  parent: State | null;
  kind: ControlKind;
  hash: NodeHash;
  origin: Transit;
  labeling: Label[];
  scope: Scope;
  stack: Value[];
  suspension: Suspension;
};

export type Atom = {
  Variable: Variable;
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Tag: NodeHash;
};

export type AspectKind = Exclude<
  StandardAspectKind,
  | "program-block@before"
  | "closure-block@before"
  | "block@declaration-overwrite"
>;

export type Advice = StandardAdvice<{
  Kind: AspectKind;
  Atom: Atom;
  Runtime: {
    State: null | State;
    StackValue: Value;
    ScopeValue: Value;
    OtherValue: Value;
  };
}>;
