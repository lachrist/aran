import { ClosureKind, Intrinsic, Parameter } from "aran";

export type Variable = string & { __brand: "Variable" };
export type Label = string & { __brand: "Label" };
export type Specifier = string & { __brand: "Specifier" };
export type Source = string & { __brand: "Source" };
export type Hash = `hash:${string}`;

export type Atom = {
  Variable: Variable;
  Label: Label;
  Specifier: Specifier;
  Source: Source;
  Tag: Hash;
};

export type Identifier = Variable | Parameter;

export type Transit =
  | { type: "void" }
  | {
      type: "apply";
      source: {
        function: Value;
        this: Value;
        arguments: Value[];
      };
      shadow: {
        function: ShadowValue;
        this: ShadowValue;
        arguments: ShadowValue[];
      };
    }
  | {
      type: "construct";
      source: {
        function: Value;
        arguments: Value[];
      };
      shadow: {
        function: ShadowValue;
        arguments: ShadowValue[];
      };
    }
  | {
      type: "return";
      source: Value;
      shadow: ShadowValue;
    };

export type ShadowValue =
  | {
      type: "arguments";
      values: ShadowValue[];
      hash: Hash;
    }
  | {
      type: "primitive";
      value: number | string | boolean | null | { bigint: string };
      hash: Hash;
    }
  | {
      type: "closure";
      kind: ClosureKind;
      hash: Hash;
    }
  | {
      type: "intrinsic";
      name: Intrinsic;
      hash: Hash;
    }
  | {
      type: "initial";
      variable: Identifier;
      hash: Hash;
    }
  | {
      type: "import";
      source: Source;
      specifier: Specifier | null;
      hash: Hash;
    }
  | {
      type: "apply";
      function: ShadowValue;
      this: ShadowValue;
      arguments: ShadowValue[];
      hash: Hash;
    }
  | {
      type: "construct";
      function: ShadowValue;
      arguments: ShadowValue[];
      hash: Hash;
    }
  | {
      type: "resolve";
      hash: Hash;
    }
  | {
      type: "resume";
      hash: Hash;
    };

export type Value = unknown & { __brand: "Value" };

export type Valuation = {
  Other: Value;
  Stack: Value;
  Scope: Value;
};

export type ShadowFrame = {
  [key in Identifier]?: ShadowValue;
};

export type ShadowState = {
  parent: ShadowState | null;
  frame: ShadowFrame;
  stack: ShadowValue[];
};
