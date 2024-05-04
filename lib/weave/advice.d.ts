import { Label, ResVariable as Variable } from "./atom";
import { Context } from "../context";
import { Frame } from "./frame";
import { BranchKind, Point } from "./point";

export type ObjectAdvice<L> = {
  "block.enter"?: <F extends Frame>(
    block: Omit<F, "frame">,
    frame: F["record"],
    location: L,
  ) => F["record"];
  "block.completion"?: (frame: Frame, value: unknown, location: L) => void;
  "block.failure"?: (block: Frame, value: unknown, location: L) => unknown;
  "block.leave"?: (block: Frame, location: L) => void;
  "debugger.before"?: (location: L) => void;
  "debugger.after"?: (location: L) => void;
  "break.before"?: (label: Label, location: L) => void;
  "branch.before"?: (kind: BranchKind, value: unknown, location: L) => unknown;
  "branch.after"?: (kind: BranchKind, value: unknown, location: L) => void;
  "intrinsic.after"?: (
    name: aran.Intrinsic,
    intrinsic: unknown,
    location: L,
  ) => unknown;
  "primitive.after"?: (primitive: Primitive, location: L) => unknown;
  "import.after"?: (
    source: string,
    specifier: string | null,
    value: unknown,
    location: L,
  ) => unknown;
  "closure.after"?: (
    kind: "arrow" | "function",
    asynchronous: boolean,
    generator: boolean,
    closure: Function,
    location: L,
  ) => unknown;
  "read.after"?: (variable: Variable, value: unknown, location: L) => unknown;
  "eval.before"?: (value: unknown, context: Context, location: L) => unknown;
  "eval.after"?: (value: unknown, location: L) => unknown;
  "await.before"?: (value: unknown, location: L) => unknown;
  "await.after"?: (value: unknown, location: L) => unknown;
  "yield.before"?: (delegate: boolean, value: unknown, location: L) => unknown;
  "yield.after"?: (delegate: boolean, value: unknown, location: L) => unknown;
  "drop.before"?: (value: unknown, location: L) => unknown;
  "export.before"?: (specifier: string, value: unknown, location: L) => unknown;
  "write.before"?: (variable: Variable, value: unknown, location: L) => unknown;
  "return.before"?: (value: unknown, location: L) => unknown;
  "apply"?: (
    callee: unknown,
    this_: unknown,
    arguments_: unknown[],
    location: L,
  ) => unknown;
  "construct"?: (
    callee: unknown,
    arguments_: unknown[],
    location: L,
  ) => unknown;
};

export type FunctionAdvice<L> = (
  point: Point<unknown, L>,
) => { [key in Variable]?: unknown } | unknown | void;

export type Advice<L> = ObjectAdvice<L> | FunctionAdvice<L>;
