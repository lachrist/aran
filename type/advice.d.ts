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

///////////////////////////
// Generic Object Advice //
///////////////////////////

type Generic = {
  Value: unknown;
  Location: unknown;
  ValueResult: unknown;
  RecordResult: unknown;
  VoidResult: unknown;
};

type GenericProgramEnterAdvice<G extends Generic> = (
  sort: Sort,
  head: Header[],
  record: { [key in Variable]?: G["Value"] },
  location: G["Location"],
) => G["RecordResult"];

type GenericProgramCompletionAdvice<G extends Generic> = (
  sort: Sort,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericProgramFailureAdvice<G extends Generic> = (
  sort: Sort,
  error: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericProgramLeaveAdvice<G extends Generic> = (
  sort: Sort,
  location: G["Location"],
) => G["VoidResult"];

type GenericFunctionEnterAdvice<G extends Generic> = (
  kind: ClosureKind,
  callee: G["Value"],
  record: { [key in Variable]?: G["Value"] },
  location: G["Location"],
) => G["RecordResult"];

type GenericFunctionCompletionAdvice<G extends Generic> = (
  kind: ClosureKind,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericFunctionFailureAdvice<G extends Generic> = (
  kind: ClosureKind,
  error: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericFunctionLeaveAdvice<G extends Generic> = (
  kind: ClosureKind,
  location: G["Location"],
) => G["VoidResult"];

type GenericBlockEnterAdvice<G extends Generic> = (
  kind: BlockKind,
  labels: Label[],
  record: { [key in Variable]?: G["Value"] },
  location: G["Location"],
) => G["RecordResult"];

type GenericBlockCompletionAdvice<G extends Generic> = (
  kind: BlockKind,
  location: G["Location"],
) => G["VoidResult"];

type GenericBlockFailureAdvice<G extends Generic> = (
  kind: BlockKind,
  error: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericBlockLeaveAdvice<G extends Generic> = (
  kind: BlockKind,
  location: G["Location"],
) => G["VoidResult"];

type GenericDebuggerBeforeAdvice<G extends Generic> = (
  location: G["Location"],
) => G["VoidResult"];

type GenericDebuggerAfterAdvice<G extends Generic> = (
  location: G["Location"],
) => G["VoidResult"];

type GenericBreakBeforeAdvice<G extends Generic> = (
  label: Label,
  location: G["Location"],
) => G["VoidResult"];

type GenericBranchBeforeAdvice<G extends Generic> = (
  kind: BranchKind,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericBranchAfterAdvice<G extends Generic> = (
  kind: BranchKind,
  location: G["Location"],
) => G["VoidResult"];

type GenericIntrinsicAfterAdvice<G extends Generic> = (
  name: aran.Intrinsic,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericPrimitiveAfterAdvice<G extends Generic> = (
  value: Primitive,
  location: G["Location"],
) => G["ValueResult"];

type GenericImportAfterAdvice<G extends Generic> = (
  source: string,
  specifier: string | null,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericFunctionAfterAdvice<G extends Generic> = (
  asynchronous: boolean,
  generator: boolean,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericArrowAfterAdvice<G extends Generic> = (
  asynchronous: boolean,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericReadAfterAdvice<G extends Generic> = (
  variable: Variable,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericConditionalBeforeAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericConditionalAfterAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericEvalBeforeAdvice<G extends Generic> = (
  value: G["Value"],
  context: InternalLocalContext,
  location: G["Location"],
) => G["ValueResult"];

type GenericEvalAfterAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericAwaitBeforeAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericAwaitAfterAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericYieldBeforeAdvice<G extends Generic> = (
  delegate: boolean,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericYieldAfterAdvice<G extends Generic> = (
  delegate: boolean,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericDropBeforeAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericExportBeforeAdvice<G extends Generic> = (
  specifier: string,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericWriteBeforeAdvice<G extends Generic> = (
  variable: Variable,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericReturnBeforeAdvice<G extends Generic> = (
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericApplyAdvice<G extends Generic> = (
  callee: G["Value"],
  this_: G["Value"],
  arguments_: G["Value"][],
  location: G["Location"],
) => G["ValueResult"];

type GenericConstructAdvice<G extends Generic> = (
  callee: G["Value"],
  arguments_: G["Value"][],
  location: G["Location"],
) => G["ValueResult"];

type GenericGlobalReadBeforeAdvice<G extends Generic> = (
  variable: estree.Variable,
  location: G["Location"],
) => G["VoidResult"];

type GenericGlobalReadAfterAdvice<G extends Generic> = (
  variable: estree.Variable,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericGlobalTypeofBeforeAdvice<G extends Generic> = (
  variable: estree.Variable,
  location: G["Location"],
) => G["VoidResult"];

type GenericGlobalTypeofAfterAdvice<G extends Generic> = (
  variable: estree.Variable,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericGlobalWriteBeforeAdvice<G extends Generic> = (
  variable: estree.Variable,
  value: G["Value"],
  location: G["Location"],
) => G["ValueResult"];

type GenericGlobalWriteAfterAdvice<G extends Generic> = (
  variable: estree.Variable,
  location: G["Location"],
) => G["VoidResult"];

type GenericGlobalDeclareBeforeAdvice<G extends Generic> = (
  kind: aran.GlobalVariableKind,
  variable: estree.Variable,
  location: G["Location"],
) => G["VoidResult"];

type GenericGlobalDeclareAfterAdvice<G extends Generic> = (
  kind: aran.GlobalVariableKind,
  variable: estree.Variable,
  location: G["Location"],
) => G["VoidResult"];

type GenericAdvice<S, G extends Generic> = {
  "program.enter"?: S | GenericProgramEnterAdvice<G>;
  "program.completion"?: S | GenericProgramCompletionAdvice<G>;
  "program.failure"?: S | GenericProgramFailureAdvice<G>;
  "program.leave"?: S | GenericProgramLeaveAdvice<G>;
  "closure.enter"?: S | GenericFunctionEnterAdvice<G>;
  "closure.completion"?: S | GenericFunctionCompletionAdvice<G>;
  "closure.failure"?: S | GenericFunctionFailureAdvice<G>;
  "closure.leave"?: S | GenericFunctionLeaveAdvice<G>;
  "block.enter"?: S | GenericBlockEnterAdvice<G>;
  "block.completion"?: S | GenericBlockCompletionAdvice<G>;
  "block.failure"?: S | GenericBlockFailureAdvice<G>;
  "block.leave"?: S | GenericBlockLeaveAdvice<G>;
  "debugger.before"?: S | GenericDebuggerBeforeAdvice<G>;
  "debugger.after"?: S | GenericDebuggerAfterAdvice<G>;
  "break.before"?: S | GenericBreakBeforeAdvice<G>;
  "branch.before"?: S | GenericBranchBeforeAdvice<G>;
  "branch.after"?: S | GenericBranchAfterAdvice<G>;
  "intrinsic.after"?: S | GenericIntrinsicAfterAdvice<G>;
  "primitive.after"?: S | GenericPrimitiveAfterAdvice<G>;
  "import.after"?: S | GenericImportAfterAdvice<G>;
  "function.after"?: S | GenericFunctionAfterAdvice<G>;
  "arrow.after"?: S | GenericArrowAfterAdvice<G>;
  "read.after"?: S | GenericReadAfterAdvice<G>;
  "conditional.before"?: S | GenericConditionalBeforeAdvice<G>;
  "conditional.after"?: S | GenericConditionalAfterAdvice<G>;
  "eval.before"?: S | GenericEvalBeforeAdvice<G>;
  "eval.after"?: S | GenericEvalAfterAdvice<G>;
  "await.before"?: S | GenericAwaitBeforeAdvice<G>;
  "await.after"?: S | GenericAwaitAfterAdvice<G>;
  "yield.before"?: S | GenericYieldBeforeAdvice<G>;
  "yield.after"?: S | GenericYieldAfterAdvice<G>;
  "drop.before"?: S | GenericDropBeforeAdvice<G>;
  "export.before"?: S | GenericExportBeforeAdvice<G>;
  "write.before"?: S | GenericWriteBeforeAdvice<G>;
  "return.before"?: S | GenericReturnBeforeAdvice<G>;
  "apply"?: S | GenericApplyAdvice<G>;
  "construct"?: S | GenericConstructAdvice<G>;
  "global.read.before"?: S | GenericGlobalReadBeforeAdvice<G>;
  "global.read.after"?: S | GenericGlobalReadAfterAdvice<G>;
  "global.typeof.before"?: S | GenericGlobalTypeofBeforeAdvice<G>;
  "global.typeof.after"?: S | GenericGlobalTypeofAfterAdvice<G>;
  "global.write.before"?: S | GenericGlobalWriteBeforeAdvice<G>;
  "global.write.after"?: S | GenericGlobalWriteAfterAdvice<G>;
  "global.declare.before"?: S | GenericGlobalDeclareBeforeAdvice<G>;
  "global.declare.after"?: S | GenericGlobalDeclareAfterAdvice<G>;
};

export type AdviceName = keyof GenericAdvice<never, never>;

///////////////////
// Object Advice //
///////////////////

type AdviceGeneric<V, L> = {
  Value: V;
  Location: L;
  ValueResult: V;
  RecordResult: { [key in Variable]?: V };
  VoidResult: void;
};

export type ProgramEnterAdvice<V, L> = GenericProgramEnterAdvice<
  AdviceGeneric<V, L>
>;

export type ProgramCompletionAdvice<V, L> = GenericProgramCompletionAdvice<
  AdviceGeneric<V, L>
>;

export type ProgramFailureAdvice<V, L> = GenericProgramFailureAdvice<
  AdviceGeneric<V, L>
>;

export type ProgramLeaveAdvice<V, L> = GenericProgramLeaveAdvice<
  AdviceGeneric<V, L>
>;

export type FunctionEnterAdvice<V, L> = GenericFunctionEnterAdvice<
  AdviceGeneric<V, L>
>;

export type FunctionCompletionAdvice<V, L> = GenericFunctionCompletionAdvice<
  AdviceGeneric<V, L>
>;

export type FunctionFailureAdvice<V, L> = GenericFunctionFailureAdvice<
  AdviceGeneric<V, L>
>;

export type FunctionLeaveAdvice<V, L> = GenericFunctionLeaveAdvice<
  AdviceGeneric<V, L>
>;

export type BlockEnterAdvice<V, L> = GenericBlockEnterAdvice<
  AdviceGeneric<V, L>
>;

export type BlockCompletionAdvice<V, L> = GenericBlockCompletionAdvice<
  AdviceGeneric<V, L>
>;

export type BlockFailureAdvice<V, L> = GenericBlockFailureAdvice<
  AdviceGeneric<V, L>
>;

export type BlockLeaveAdvice<V, L> = GenericBlockLeaveAdvice<
  AdviceGeneric<V, L>
>;

export type DebuggerBeforeAdvice<V, L> = GenericDebuggerBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type DebuggerAfterAdvice<V, L> = GenericDebuggerAfterAdvice<
  AdviceGeneric<V, L>
>;

export type BreakBeforeAdvice<V, L> = GenericBreakBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type BranchBeforeAdvice<V, L> = GenericBranchBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type BranchAfterAdvice<V, L> = GenericBranchAfterAdvice<
  AdviceGeneric<V, L>
>;

export type IntrinsicAfterAdvice<V, L> = GenericIntrinsicAfterAdvice<
  AdviceGeneric<V, L>
>;

export type PrimitiveAfterAdvice<V, L> = GenericPrimitiveAfterAdvice<
  AdviceGeneric<V, L>
>;

export type ImportAfterAdvice<V, L> = GenericImportAfterAdvice<
  AdviceGeneric<V, L>
>;

export type FunctionAfterAdvice<V, L> = GenericFunctionAfterAdvice<
  AdviceGeneric<V, L>
>;

export type ArrowAfterAdvice<V, L> = GenericArrowAfterAdvice<
  AdviceGeneric<V, L>
>;

export type ReadAfterAdvice<V, L> = GenericReadAfterAdvice<AdviceGeneric<V, L>>;

export type ConditionalBeforeAdvice<V, L> = GenericConditionalBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type ConditionalAfterAdvice<V, L> = GenericConditionalAfterAdvice<
  AdviceGeneric<V, L>
>;

export type EvalBeforeAdvice<V, L> = GenericEvalBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type EvalAfterAdvice<V, L> = GenericEvalAfterAdvice<AdviceGeneric<V, L>>;

export type AwaitBeforeAdvice<V, L> = GenericAwaitBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type AwaitAfterAdvice<V, L> = GenericAwaitAfterAdvice<
  AdviceGeneric<V, L>
>;

export type YieldBeforeAdvice<V, L> = GenericYieldBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type YieldAfterAdvice<V, L> = GenericYieldAfterAdvice<
  AdviceGeneric<V, L>
>;

export type DropBeforeAdvice<V, L> = GenericDropBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type ExportBeforeAdvice<V, L> = GenericExportBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type WriteBeforeAdvice<V, L> = GenericWriteBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type ReturnBeforeAdvice<V, L> = GenericReturnBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type ApplyAdvice<V, L> = GenericApplyAdvice<AdviceGeneric<V, L>>;

export type ConstructAdvice<V, L> = GenericConstructAdvice<AdviceGeneric<V, L>>;

export type GlobalReadBeforeAdvice<V, L> = GenericGlobalReadBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalReadAfterAdvice<V, L> = GenericGlobalReadAfterAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalTypeofBeforeAdvice<V, L> = GenericGlobalTypeofBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalTypeofAfterAdvice<V, L> = GenericGlobalTypeofAfterAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalWriteBeforeAdvice<V, L> = GenericGlobalWriteBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalWriteAfterAdvice<V, L> = GenericGlobalWriteAfterAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalDeclareBeforeAdvice<V, L> = GenericGlobalDeclareBeforeAdvice<
  AdviceGeneric<V, L>
>;

export type GlobalDeclareAfterAdvice<V, L> = GenericGlobalDeclareAfterAdvice<
  AdviceGeneric<V, L>
>;

export type ObjectAdvice<V, L> = GenericAdvice<never, AdviceGeneric<V, L>>;

export type ObjectPointcut<L> = GenericAdvice<
  boolean,
  {
    Value: null;
    Location: L;
    ValueResult: boolean;
    RecordResult: boolean;
    VoidResult: boolean;
  }
>;

/////////////////////////////
// Generic Function Advice //
/////////////////////////////

type Point<V, L> =
  //////////////
  // Informer //
  //////////////
  // Program //
  | {
      type: "program.enter";
      sort: Sort;
      head: Header[];
      record: {
        [key in Variable]: V;
      };
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
      record: {
        [key in Variable]: V;
      };
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
      record: {
        [key in Variable]: V;
      };
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
  // read-external //
  | {
      type: "global.read.before";
      variable: estree.Variable;
      location: L;
    }
  | {
      type: "global.read.after";
      variable: estree.Variable;
      value: V;
      location: L;
    }
  // typeof-external //
  | {
      type: "global.typeof.before";
      variable: estree.Variable;
      location: L;
    }
  | {
      type: "global.typeof.after";
      variable: estree.Variable;
      value: V;
      location: L;
    }
  // write-external //
  | {
      type: "global.write.before";
      variable: estree.Variable;
      value: V;
      location: L;
    }
  | {
      type: "global.write.after";
      variable: estree.Variable;
      location: L;
    }
  // declare-external //
  | {
      type: "global.declare.before";
      kind: aran.GlobalVariableKind;
      variable: estree.Variable;
      location: L;
    }
  | {
      type: "global.declare.after";
      kind: aran.GlobalVariableKind;
      variable: estree.Variable;
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

type RecordAdviceName = ["program.enter", "closure.enter", "block.enter"];

type VoidAdviceName = [
  "program.leave",
  "closure.leave",
  "block.completion",
  "block.leave",
  "debugger.before",
  "debugger.after",
  "break.before",
  "branch.after",
  "global.read.before",
  "global.typeof.before",
  "global.write.after",
  "global.declare.after",
];

type ValueAdviceName = Exclude<AdviceName, RecordAdviceName | VoidAdviceName>;

export type FunctionAdvice<V, L> = (
  point: Point<V, L>,
) => { [key in Variable]?: V } | V | void;

type FunctionPointcut<L> = (point: Point<Expression, L>) => boolean;

///////////
// Union //
///////////

type IterablePointcut = Iterable<AdviceName>;

type ConstantPointcut = boolean;

export type Advice<V, L> = ObjectAdvice<V, L> | FunctionAdvice<V, L>;

export type Pointcut<L> =
  | FunctionPointcut<L>
  | IterablePointcut
  | ObjectPointcut<L>
  | ConstantPointcut;
