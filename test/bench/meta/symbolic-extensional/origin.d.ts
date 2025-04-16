import { ClosureKind, Intrinsic } from "aran";

export type Value = { __brand: "Value" };

export type AtomicOrigin =
  | {
      type: "literal" | "yield" | "await" | "initial";
      value: Value;
      hash: string;
    }
  | {
      type: "intrinsic";
      name: Intrinsic;
      value: Value;
      hash: string;
    }
  | {
      type: "import";
      value: Value;
      source: string;
      specifier: null | string;
      hash: string;
    }
  | {
      type: "closure";
      kind: ClosureKind;
      value: Value;
      hash: string;
    };

export type CompoundOrigin =
  | {
      type: "apply";
      value: Value;
      callee: Origin;
      that: Origin;
      input: Origin[];
      hash: string;
    }
  | {
      type: "construct";
      value: Value;
      callee: Origin;
      input: Origin[];
      hash: string;
    };

export type Origin = AtomicOrigin | CompoundOrigin;
