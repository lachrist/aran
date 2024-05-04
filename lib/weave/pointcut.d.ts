import { Context } from "../context";
import { Label, ArgVariable, ResExpression as Expression } from "./atom";
import { Frame } from "./frame";
import { BranchKind, Point, PointName } from "./point";

type Variable = ArgVariable | aran.Parameter;

export type ObjectPointcut<L> = {
  "block.enter"?:
    | boolean
    | (<B extends Frame>(
        block: Omit<B, "frame">,
        frame: { [key in keyof B["record"]]: null },
        location: L,
      ) => boolean);
  "block.completion"?:
    | boolean
    | ((block: Omit<Frame, "frame">, value: null, location: L) => boolean);
  "block.failure"?:
    | boolean
    | ((block: Omit<Frame, "frame">, value: null, location: L) => boolean);
  "block.leave"?:
    | boolean
    | ((block: Omit<Frame, "frame">, location: L) => boolean);
  "debugger.before"?: boolean | ((location: L) => boolean);
  "debugger.after"?: boolean | ((location: L) => boolean);
  "break.before"?: boolean | ((label: Label, location: L) => boolean);
  "branch.before"?:
    | boolean
    | ((kind: BranchKind, value: null, location: L) => boolean);
  "branch.after"?:
    | boolean
    | ((kind: BranchKind, value: null, location: L) => boolean);
  "intrinsic.after"?:
    | boolean
    | ((name: aran.Intrinsic, value: null, location: L) => boolean);
  "primitive.after"?:
    | boolean
    | ((primitive: Primitive, location: L) => boolean);
  "import.after"?:
    | boolean
    | ((
        source: string,
        specifier: string | null,
        value: null,
        location: L,
      ) => boolean);
  "closure.after"?:
    | boolean
    | ((
        kind: "arrow" | "function",
        asynchronous: boolean,
        generator: boolean,
        closure: null,
        location: L,
      ) => boolean);
  "read.after"?:
    | boolean
    | ((variable: Variable, value: null, location: L) => boolean);
  "eval.before"?:
    | boolean
    | ((value: null, context: Context, location: L) => boolean);
  "eval.after"?: boolean | ((value: null, location: L) => boolean);
  "await.before"?: boolean | ((value: null, location: L) => boolean);
  "await.after"?: boolean | ((value: null, location: L) => boolean);
  "yield.before"?:
    | boolean
    | ((delegate: boolean, value: null, location: L) => boolean);
  "yield.after"?:
    | boolean
    | ((delegate: boolean, value: null, location: L) => boolean);
  "drop.before"?: boolean | ((value: null, location: L) => boolean);
  "export.before"?:
    | boolean
    | ((specifier: string, value: null, location: L) => boolean);
  "write.before"?:
    | boolean
    | ((variable: Variable, value: null, location: L) => boolean);
  "return.before"?: boolean | ((value: null, location: L) => boolean);
  "apply"?:
    | boolean
    | ((callee: null, this_: null, arguments_: null[], location: L) => boolean);
  "construct"?:
    | boolean
    | ((callee: null, arguments_: null[], location: L) => boolean);
};

export type FunctionPointcut<L> = (point: Point<Expression, L>) => boolean;

export type IterablePointcut = Iterable<PointName>;

export type ConstantPointcut = boolean;

export type Pointcut<L> =
  | FunctionPointcut<L>
  | IterablePointcut
  | ObjectPointcut<L>
  | ConstantPointcut;
