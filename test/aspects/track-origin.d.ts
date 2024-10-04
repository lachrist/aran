import type {
  AranVariable,
  AranParameter,
  AranIntrinsicName,
  AranSource,
  AranSpecifier,
  ClosureKind,
} from "../../";
import type { NodeHash } from "../262/aran/config";

export type Key = AranVariable | AranParameter;

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
      hash: NodeHash;
    }
  | {
      type: "primitive";
      value: number | string | boolean | null | { bigint: string };
      hash: NodeHash;
    }
  | {
      type: "closure";
      kind: ClosureKind;
      hash: NodeHash;
    }
  | {
      type: "intrinsic";
      name: AranIntrinsicName;
      hash: NodeHash;
    }
  | {
      type: "initial";
      variable: Key;
      hash: NodeHash;
    }
  | {
      type: "import";
      source: AranSource;
      specifier: AranSpecifier | null;
      hash: NodeHash;
    }
  | {
      type: "apply";
      function: ShadowValue;
      this: ShadowValue;
      arguments: ShadowValue[];
      hash: NodeHash;
    }
  | {
      type: "construct";
      function: ShadowValue;
      arguments: ShadowValue[];
      hash: NodeHash;
    }
  | {
      type: "resolve";
      hash: NodeHash;
    }
  | {
      type: "resume";
      hash: NodeHash;
    };

export type Value = unknown & { __brand: "Value" };

export type Valuation = {
  Other: Value;
  Stack: Value;
  Scope: Value;
};

export type ShadowFrame = {
  [key in Key]?: ShadowValue;
};

export type ShadowState = {
  parent: ShadowState | null;
  frame: ShadowFrame;
  stack: ShadowValue[];
};
