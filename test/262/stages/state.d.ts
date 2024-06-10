import type {
  Variable,
  Parameter,
  BlockKind,
  Path,
  Label,
  Frame as GenericFrame,
  TaggedFrame as GenericTaggedFrame,
} from "../../../lib/index";

export type Value = { __brand: "Value" };

export type Valuation = {
  Stack: Value;
  Scope: Value;
  Other: Value;
};

export type Frame = GenericFrame<Valuation>;

export type TaggedFrame = GenericTaggedFrame<Valuation>;

export type Call =
  | {
      type: "external";
    }
  | {
      type: "apply";
      callee: Value;
      self: Value;
      input: Value[];
    }
  | {
      type: "construct";
      callee: Value;
      target: Value;
      input: Value[];
    }
  | {
      type: "ongoing";
      stack: Value[];
    }
  | {
      type: "success";
      result: Value;
    }
  | {
      type: "failure";
      error: Value;
    };

export type Callstack = Call[];

export type Scope = {
  kind: BlockKind;
  parent: Scope | null;
  path: Path;
  labels: Label[];
  frame: Frame;
  suspended: boolean;
};
