import { ClosureKind, Intrinsic } from "aran";

export type Serial =
  | null
  | boolean
  | string
  | number
  | { bigint: string }
  | { symbol: string | null }
  | { undefined: null }
  | { reference: null };

export type Record = {
  (type: "primitive", index: number, value: Serial, hash: string): void;
  (
    type: "initial",
    index: number,
    value: Serial,
    variable: string,
    hash: string,
  ): void;
  (
    type: "intrinsic",
    index: number,
    value: Serial,
    name: Intrinsic,
    hash: string,
  ): void;
  (
    type: "import",
    index: number,
    value: Serial,
    source: string,
    specifier: string | null,
    hash: string,
  ): void;
  (type: "await", index: number, value: Serial, hash: string): void;
  (type: "yield", index: number, value: Serial, hash: string): void;
  (
    type: "closure",
    index: number,
    value: Serial,
    kind: ClosureKind,
    hash: string,
  ): void;
  (
    type: "apply",
    index: number,
    value: Serial,
    callee: number,
    that: number,
    input: number[],
    hash: string,
  ): void;
  (
    type: "construct",
    index: number,
    value: Serial,
    callee: number,
    input: number[],
    hash: string,
  ): void;
};
