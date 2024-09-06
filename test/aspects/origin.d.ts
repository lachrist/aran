import type {
  Variable,
  Parameter,
  Path,
  Intrinsic,
  EstreeSpecifier,
  EstreeSource,
  ClosureKind,
} from "../../lib";
export type { Kind } from "../../lib/weave/standard/aspect";

export type Key = Variable | Parameter;

export type Transit =
  | {
      type: "void";
    }
  | {
      type: "eval";
    }
  | {
      type: "apply";
      callee: ShadowValue;
      this: ShadowValue;
      arguments: ShadowValue[];
    }
  | {
      type: "construct";
      callee: ShadowValue;
      arguments: ShadowValue[];
    }
  | {
      type: "return";
      result: ShadowValue;
    };

export type ShadowValue =
  | {
      type: "arguments";
      values: ShadowValue[];
      path: Path;
    }
  | {
      type: "primitive";
      value: number | string | boolean | null | { bigint: string };
      path: Path;
    }
  | {
      type: "closure";
      kind: ClosureKind;
      path: Path;
    }
  | {
      type: "intrinsic";
      name: Intrinsic;
      path: Path;
    }
  | {
      type: "initial";
      variable: Key;
      path: Path;
    }
  | {
      type: "import";
      source: EstreeSource;
      specifier: EstreeSpecifier | null;
      path: Path;
    }
  | {
      type: "apply";
      callee: ShadowValue;
      this: ShadowValue;
      arguments: ShadowValue[];
      path: Path;
    }
  | {
      type: "construct";
      callee: ShadowValue;
      arguments: ShadowValue[];
      path: Path;
    }
  | {
      type: "resolve";
      path: Path;
    }
  | {
      type: "resume";
      path: Path;
    };

export type Value = unknown & { __brand: "Value" };

export type Valuation = {
  Other: Value;
  Stack: Value;
  Scope: Value;
};

export type ShadowFrame = {
  [key in Variable | Parameter]?: ShadowValue;
};

export type ShadowState = {
  parent: ShadowState | null;
  transit: Transit;
  frame: ShadowFrame;
  stack: ShadowValue[];
};
