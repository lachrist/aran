import { ClosureKind } from "aran";
import { StandardPrimitive } from "linvail";

export type Reference = { __brand: "Reference" };

export type Value = Reference | StandardPrimitive | symbol;

export type PrimitiveWrapper =
  | {
      type: "primitive";
      kind: "standard";
      inner: StandardPrimitive;
      prov: number;
    }
  | {
      type: "primitive";
      kind: "symbol";
      inner: symbol;
      prov: 0;
    };

export type ReferenceWrapper =
  | {
      type: "reference";
      kind: "input";
      inner: Reference;
      prov: 0;
      init: Wrapper[];
    }
  | {
      type: "reference";
      kind: "regular" | ClosureKind;
      inner: Reference;
      prov: 0;
    };

export type Wrapper = PrimitiveWrapper | ReferenceWrapper;

export type Registry = WeakMap<Reference, ReferenceWrapper>;
