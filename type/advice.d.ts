import type { Header } from "../lib/header.d.ts";
import type { InternalLocalContext } from "../lib/context.d.js";
import { Sort } from "../lib/sort.js";

export type BranchKind = "conditional" | "if" | "while";

export type ClosureKind = "arrow" | "function";

export type Mode = "strict" | "sloppy";

export type BlockKind =
  | "try"
  | "catch"
  | "finally"
  | "then"
  | "else"
  | "loop"
  | "naked";

export type LinkData =
  | {
      type: "import";
      source: estree.Source;
      specifier: estree.Specifier | null;
    }
  | {
      type: "export";
      export: estree.Specifier;
    }
  | {
      type: "aggregate";
      source: estree.Source;
      import: estree.Specifier | null;
      export: estree.Specifier | null;
    };

export type Variable = aran.Parameter | weave.ArgVariable;

export type Expression = aran.Expression<weave.ResAtom>;

export type Label = weave.Label;

export type AdviceName =
  | "program.enter"
  | "program.completion"
  | "program.failure"
  | "program.leave"
  | "closure.enter"
  | "closure.completion"
  | "closure.failure"
  | "closure.leave"
  | "block.enter"
  | "block.completion"
  | "block.failure"
  | "block.leave"
  | "debugger.before"
  | "debugger.after"
  | "break.before"
  | "branch.before"
  | "branch.after"
  | "intrinsic.after"
  | "primitive.after"
  | "import.after"
  | "function.after"
  | "arrow.after"
  | "read.after"
  | "conditional.before"
  | "conditional.after"
  | "eval.before"
  | "eval.after"
  | "await.before"
  | "await.after"
  | "yield.before"
  | "yield.after"
  | "drop.before"
  | "export.before"
  | "write.before"
  | "return.before"
  | "apply"
  | "construct";

/////////////////////
// Function Format //
/////////////////////

export type ObjectPointcut<L> = {
  "program.enter"?:
    | boolean
    | ((
        sort: Sort,
        head: Header[],
        frame: { [key in Variable]?: null },
        location: L,
      ) => boolean);
  "program.completion"?:
    | boolean
    | ((sort: Sort, value: null, location: L) => boolean);
  "program.failure"?:
    | boolean
    | ((sort: Sort, value: null, location: L) => boolean);
  "program.leave"?: boolean | ((sort: Sort, location: L) => boolean);
  "closure.enter"?:
    | boolean
    | ((
        kind: ClosureKind,
        callee: null,
        frame: { [key in Variable]?: null },
        location: L,
      ) => boolean);
  "closure.completion"?:
    | boolean
    | ((kind: ClosureKind, value: null, location: L) => boolean);
  "closure.failure"?:
    | boolean
    | ((kind: ClosureKind, value: null, location: L) => boolean);
  "closure.leave"?: boolean | ((kind: ClosureKind, location: L) => boolean);
  "block.enter"?:
    | boolean
    | ((
        kind: BlockKind,
        labels: Label[],
        frame: { [key in Variable]?: null },
        location: L,
      ) => boolean);
  "block.completion"?: boolean | ((kind: BlockKind, location: L) => boolean);
  "block.failure"?:
    | boolean
    | ((kind: BlockKind, value: null, location: L) => boolean);
  "block.leave"?: boolean | ((kind: BlockKind, location: L) => boolean);
  "debugger.before"?: boolean | ((location: L) => boolean);
  "debugger.after"?: boolean | ((location: L) => boolean);
  "break.before"?: boolean | ((label: Label, location: L) => boolean);
  "branch.before"?:
    | boolean
    | ((kind: BranchKind, value: null, location: L) => boolean);
  "branch.after"?: boolean | ((kind: BranchKind, location: L) => boolean);
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
  "function.after"?:
    | boolean
    | ((
        asynchronous: boolean,
        generator: boolean,
        closure: null,
        location: L,
      ) => boolean);
  "arrow.after"?:
    | boolean
    | ((asynchronous: boolean, closure: null, location: L) => boolean);
  "read.after"?:
    | boolean
    | ((variable: Variable, value: null, location: L) => boolean);
  "conditional.before"?: boolean | ((value: null, location: L) => boolean);
  "conditional.after"?: boolean | ((value: null, location: L) => boolean);
  "eval.before"?:
    | boolean
    | ((value: null, context: InternalLocalContext, location: L) => boolean);
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

export type ObjectAdvice<L> = {
  "program.enter"?: (
    sort: Sort,
    head: Header[],
    frame: { [key in Variable]?: unknown },
    location: L,
  ) => { [key in Variable]?: unknown };
  "program.completion"?: (sort: Sort, value: unknown, location: L) => unknown;
  "program.failure"?: (sort: Sort, value: unknown, location: L) => unknown;
  "program.leave"?: (sort: Sort, location: L) => void;
  "closure.enter"?: (
    kind: ClosureKind,
    callee: unknown,
    frame: { [key in Variable]?: unknown },
    location: L,
  ) => { [key in Variable]?: unknown };
  "closure.completion"?: (
    kind: ClosureKind,
    location: L,
    value: unknown,
  ) => unknown;
  "closure.failure"?: (
    kind: ClosureKind,
    value: unknown,
    location: L,
  ) => unknown;
  "closure.leave"?: (kind: ClosureKind, location: L) => void;
  "block.enter"?: (
    kind: BlockKind,
    labels: Label[],
    frame: { [key in Variable]?: unknown },
    location: L,
  ) => { [key in Variable]?: unknown };
  "block.completion"?: (kind: BlockKind, location: L) => void;
  "block.failure"?: (kind: BlockKind, value: unknown, location: L) => unknown;
  "block.leave"?: (kind: BlockKind, location: L) => void;
  "debugger.before"?: (location: L) => void;
  "debugger.after"?: (location: L) => void;
  "break.before"?: (label: Label, location: L) => void;
  "branch.before"?: (kind: BranchKind, value: unknown, location: L) => unknown;
  "branch.after"?: (kind: BranchKind, location: L) => void;
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
  "function.after"?: (
    asynchronous: boolean,
    generator: boolean,
    closure: Function,
    location: L,
  ) => unknown;
  "arrow.after"?: (
    asynchronous: boolean,
    closure: Function,
    location: L,
  ) => unknown;
  "read.after"?: (variable: Variable, value: unknown, location: L) => unknown;
  "conditional.before"?: (value: unknown, location: L) => unknown;
  "conditional.after"?: (value: unknown, location: L) => unknown;
  "eval.before"?: (
    value: unknown,
    context: InternalLocalContext,
    location: L,
  ) => unknown;
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

/////////////////////
// Function Format //
/////////////////////

type Point<V, L> =
  //////////////
  // Informer //
  //////////////
  // Program //
  | {
      type: "program.enter";
      sort: Sort;
      head: Header[];
      frame: { [key in Variable]: V };
      location: L;
    }
  | {
      type: "program.completion";
      sort: Sort;
      value: V;
      location: L;
    }
  | {
      type: "program.failure";
      sort: Sort;
      value: V;
      location: L;
    }
  | {
      type: "program.leave";
      sort: Sort;
      location: L;
    }
  // closure //
  | {
      type: "closure.enter";
      kind: ClosureKind;
      callee: V;
      frame: { [key in Variable]: V };
      location: L;
    }
  | {
      type: "closure.completion";
      kind: ClosureKind;
      location: L;
      value: V;
    }
  | {
      type: "closure.failure";
      kind: ClosureKind;
      value: V;
      location: L;
    }
  | {
      type: "closure.leave";
      kind: ClosureKind;
      location: L;
    }
  // Block //
  | {
      type: "block.enter";
      kind: BlockKind;
      labels: Label[];
      frame: { [key in Variable]: V };
      location: L;
    }
  | {
      type: "block.completion";
      kind: BlockKind;
      location: L;
    }
  | {
      type: "block.failure";
      kind: BlockKind;
      value: V;
      location: L;
    }
  | {
      type: "block.leave";
      kind: BlockKind;
      location: L;
    }
  // Debugger //
  | {
      type: "debugger.before";
      location: L;
    }
  | {
      type: "debugger.after";
      location: L;
    }
  // Break //
  | {
      type: "break.before";
      label: Label;
      location: L;
    }
  ///////////////////
  // Pure Producer //
  ///////////////////
  | {
      type: "primitive.after";
      value: Primitive;
      location: L;
    }
  | {
      type: "read.after";
      variable: Variable;
      value: V;
      location: L;
    }
  | {
      type: "intrinsic.after";
      name: aran.Intrinsic;
      value: V;
      location: L;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: V;
      location: L;
    }
  | {
      type: "function.after";
      asynchronous: boolean;
      generator: boolean;
      value: V;
      location: L;
    }
  | {
      type: "arrow.after";
      asynchronous: boolean;
      value: V;
      location: L;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: V;
      location: L;
    }
  | {
      type: "drop.before";
      value: V;
      location: L;
    }
  | {
      type: "export.before";
      specifier: string;
      value: V;
      location: L;
    }
  | {
      type: "write.before";
      variable: Variable;
      value: V;
      location: L;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Branch //
  | {
      type: "branch.before";
      kind: BranchKind;
      value: V;
      location: L;
    }
  | {
      type: "branch.after";
      kind: BranchKind;
      location: L;
    }
  // Conditional //
  | {
      type: "conditional.before";
      value: V;
      location: L;
    }
  | {
      type: "conditional.after";
      value: V;
      location: L;
    }
  // Eval //
  | {
      type: "eval.before";
      value: V;
      context: InternalLocalContext;
      location: L;
    }
  | {
      type: "eval.after";
      value: V;
      location: L;
    }
  // Await //
  | {
      type: "await.before";
      value: V;
      location: L;
    }
  | {
      type: "await.after";
      value: V;
      location: L;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: V;
      location: L;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: V;
      location: L;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: V;
      this: V;
      arguments: V[];
      location: L;
    }
  | {
      type: "construct";
      callee: V;
      arguments: V[];
      location: L;
    };

export type FunctionAdvice<L> = (
  point: Point<unknown, L>,
) => { [key in Variable]?: unknown } | unknown | void;

type FunctionPointcut<L> = (point: Point<Expression, L>) => boolean;

///////////
// Union //
///////////

type IterablePointcut = Iterable<AdviceName>;

type ConstantPointcut = boolean;

export type Advice<L> = ObjectAdvice<L> | FunctionAdvice<L>;

export type Pointcut<L> =
  | FunctionPointcut<L>
  | IterablePointcut
  | ObjectPointcut<L>
  | ConstantPointcut;

///////////
// Check //
///////////

type Valid = [
  AdviceName extends keyof ObjectAdvice<any> ? true : false,
  keyof ObjectAdvice<any> extends AdviceName ? true : false,
  AdviceName extends keyof ObjectPointcut<any> ? true : false,
  keyof ObjectPointcut<any> extends AdviceName ? true : false,
  AdviceName extends Point<any, any>["type"] ? true : false,
  Point<any, any>["type"] extends AdviceName ? true : false,
];
