import { DeepLocalContext } from "../lib/program";
import { Point } from "../lib/weave/point";
import { IntrinsicRecord } from "./aran";

export type AdviceParametrization = {
  Source: string;
  Specifier: string;
  Label: string;
  Variable: string;
  Location: Json;
  PrivateKey: string;
  FrontierValue: unknown;
  ScopeValue: unknown;
  StackValue: unknown;
};

type Mode = "strict" | "sloppy";

type BranchKind =
  | "if"
  | "while"
  | "conditional.effect"
  | "conditional.expression";

type ClosureKind = "arrow" | "function";

type DeclareHeader<P extends AdviceParametrization> = {
  type: "declare";
  mode: Mode;
  kind: "let" | "var";
  variable: P["Variable"];
};

type LinkHeader<P extends AdviceParametrization> =
  | {
      type: "import";
      source: P["Source"];
      import: P["Specifier"] | null;
    }
  | {
      type: "export";
      export: P["Specifier"];
    }
  | {
      type: "aggregate";
      source: P["Source"];
      import: P["Specifier"] | null;
      export: P["Specifier"] | null;
    };

type ParameterHeader<P extends AdviceParametrization> =
  | {
      type: "parameter";
      mode: Mode;
      parameter:
        | "this"
        | "import.meta"
        | "import.dynamic"
        | "new.target"
        | "super.get"
        | "super.set"
        | "super.call";
      payload: null;
    }
  | {
      type: "parameter";
      mode: Mode;
      parameter:
        | "scope.read"
        | "scope.write"
        | "scope.typeof"
        | "scope.discard";
      payload: P["Variable"];
    }
  | {
      type: "parameter";
      mode: Mode;
      parameter: "private.get" | "private.set" | "private.has";
      payload: P["PrivateKey"];
    };

type ModuleHeader<P extends AdviceParametrization> =
  | LinkHeader<P>
  | (ParameterHeader<P> & {
      mode: "strict";
      parameter:
        | "this"
        | "import.dynamic"
        | "import.meta"
        | "scope.read"
        | "scope.write"
        | "scope.typeof"
        | "scope.discard";
    });

type ScriptHeader<P extends AdviceParametrization> =
  | DeclareHeader<P>
  | (ParameterHeader<P> & {
      parameter:
        | "this"
        | "import.dynamic"
        | "scope.read"
        | "scope.write"
        | "scope.typeof"
        | "scope.discard";
    });

type GlobalEvalHeader<P extends AdviceParametrization> =
  | (DeclareHeader<P> & { mode: "strict"; kind: "var" })
  | (ParameterHeader<P> & {
      parameter:
        | "this"
        | "import.dynamic"
        | "scope.read"
        | "scope.write"
        | "scope.typeof"
        | "scope.discard";
    });

type RootLocalEvalHeader<P extends AdviceParametrization> =
  | (DeclareHeader<P> & { mode: "strict"; kind: "var" })
  | ParameterHeader<P>;

type DeepLocalEvalHeader<P extends AdviceParametrization> = ParameterHeader<P>;

export type ProgramFrame<P extends AdviceParametrization> =
  | {
      type: "program";
      kind: "module";
      situ: "global";
      head: ModuleHeader<P>[];
    }
  | {
      type: "program";
      kind: "script";
      situ: "global";
      head: ScriptHeader<P>[];
    }
  | {
      type: "program";
      kind: "eval";
      situ: "global";
      head: GlobalEvalHeader<P>[];
    }
  | {
      type: "program";
      kind: "eval";
      situ: "local.root";
      head: RootLocalEvalHeader<P>[];
    }
  | {
      type: "program";
      kind: "eval";
      situ: "local.deep";
      head: DeepLocalEvalHeader<P>[];
    };

export type ClosureFrame<P extends AdviceParametrization> =
  | {
      type: "closure";
      kind: "arrow";
      asynchronous: boolean;
      generator: false;
    }
  | {
      type: "closure";
      kind: "function";
      asynchronous: boolean;
      generator: boolean;
    };

export type ControlFrame<P extends AdviceParametrization> =
  | {
      type: "control";
      kind: "catch";
      labels: P["Label"][];
    }
  | {
      type: "control";
      kind: "try" | "finally" | "then" | "else" | "loop" | "naked";
      labels: P["Label"][];
    };

export type Frame<P extends AdviceParametrization> =
  | ProgramFrame<P>
  | ClosureFrame<P>
  | ControlFrame<P>;

export type ObjectAdvice<P extends AdviceParametrization> = {
  "block.enter"?: (
    frame: Frame<P>,
    record: { [key in P["Variable"] | aran.Parameter]?: P["FrontierValue"] },
    location: P["Location"],
  ) => { [key in P["Variable"] | aran.Parameter]?: P["ScopeValue"] };
  "block.completion"?: <F extends Frame<P>>(
    frame: F,
    value: F["type"] extends "control" ? undefined : P["StackValue"],
    location: P["Location"],
  ) => F["type"] extends "control" ? undefined : P["FrontierValue"];
  "block.failure"?: (
    frame: Frame<P>,
    value: P["FrontierValue"],
    location: P["Location"],
  ) => P["FrontierValue"];
  "block.leave"?: (frame: Frame<P>, location: P["Location"]) => undefined;
  "debugger.before"?: (location: P["Location"]) => undefined;
  "debugger.after"?: (location: P["Location"]) => undefined;
  "break.before"?: (label: P["Label"], location: P["Location"]) => undefined;
  "branch.before"?: (
    kind: BranchKind,
    value: P["StackValue"],
    location: P["Location"],
  ) => boolean;
  "branch.after"?: <K extends BranchKind>(
    kind: K,
    value: K extends "conditional.expression" ? P["StackValue"] : undefined,
    location: P["Location"],
  ) => K extends "conditional.expression" ? P["StackValue"] : undefined;
  "intrinsic.after"?: <N extends aran.Intrinsic>(
    name: N,
    value: IntrinsicRecord[N],
    location: P["Location"],
  ) => P["StackValue"];
  "primitive.after"?: (
    primitive: Primitive,
    location: P["Location"],
  ) => P["Location"];
  "import.after"?: (
    source: P["Source"],
    specifier: P["Specifier"] | null,
    value: P["FrontierValue"],
    location: P["Location"],
  ) => P["StackValue"];
  "closure.after"?: (
    kind: ClosureKind,
    asynchronous: boolean,
    generator: boolean,
    closure: Function,
    location: P["Location"],
  ) => P["StackValue"];
  "read.after"?: (
    variable: P["Variable"] | aran.Parameter,
    value: P["ScopeValue"],
    location: P["Location"],
  ) => P["StackValue"];
  "eval.before"?: (
    value: P["StackValue"],
    context: DeepLocalContext,
    location: P["Location"],
  ) => string | undefined;
  "eval.after"?: (
    value: P["FrontierValue"],
    location: P["Location"],
  ) => P["StackValue"];
  "await.before"?: (
    value: P["StackValue"],
    location: P["Location"],
  ) => P["FrontierValue"];
  "await.after"?: (
    value: P["FrontierValue"],
    location: P["Location"],
  ) => P["StackValue"];
  "yield.before"?: (
    delegate: boolean,
    value: P["StackValue"],
    location: P["Location"],
  ) => P["FrontierValue"];
  "yield.after"?: (
    delegate: boolean,
    value: P["FrontierValue"],
    location: P["Location"],
  ) => P["StackValue"];
  "drop.before"?: (
    value: P["StackValue"],
    location: P["Location"],
  ) => undefined;
  "export.before"?: (
    specifier: P["Specifier"],
    value: P["StackValue"],
    location: P["Location"],
  ) => P["FrontierValue"];
  "write.before"?: (
    variable: P["Variable"] | aran.Parameter,
    value: P["StackValue"],
    location: P["Location"],
  ) => P["ScopeValue"];
  "return.before"?: (
    value: P["StackValue"],
    location: P["Location"],
  ) => P["FrontierValue"];
  "apply"?: (
    callee: P["StackValue"],
    this_: P["StackValue"],
    arguments_: P["StackValue"][],
    location: P["Location"],
  ) => P["StackValue"];
  "construct"?: (
    callee: P["StackValue"],
    arguments_: P["StackValue"][],
    location: P["Location"],
  ) => P["StackValue"];
};

export type FunctionAdvice<V, L> = (
  point: Point<V, L>,
) => { [key in string]?: V } | V | void;
