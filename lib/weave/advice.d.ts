import { EvalContext } from "../unbuild/context";

type BranchKind = "conditional" | "if" | "while";

type BlockKind =
  | "try"
  | "catch"
  | "finally"
  | "then"
  | "else"
  | "loop"
  | "naked";

//////////////
// Pointcut //
//////////////

type LinkData =
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

export type Point<L> =
  //////////////
  // Informer //
  //////////////
  // Program //
  | {
      type: "program.enter";
      kind: aran.ProgramKind;
      links: LinkData[];
      frame: {
        [key in
          | aran.Parameter
          | weave.ArgVariable]: aran.Expression<weave.ResAtom>;
      };
      location: L;
    }
  | {
      type: "program.completion";
      kind: aran.ProgramKind;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "program.failure";
      kind: aran.ProgramKind;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "program.leave";
      kind: aran.ProgramKind;
      location: L;
    }
  // function //
  | {
      type: "function.enter";
      kind: aran.FunctionKind;
      callee: aran.Expression<weave.ResAtom>;
      frame: {
        [key in
          | aran.Parameter
          | weave.ArgVariable]: aran.Expression<weave.ResAtom>;
      };
      location: L;
    }
  | {
      type: "function.completion";
      kind: aran.FunctionKind;
      location: L;
      value: aran.Expression<weave.ResAtom>;
    }
  | {
      type: "function.failure";
      kind: aran.FunctionKind;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "function.leave";
      kind: aran.FunctionKind;
      location: L;
    }
  // Block //
  | {
      type: "block.enter";
      kind: BlockKind;
      labels: weave.Label[];
      frame: {
        [key in
          | aran.Parameter
          | weave.ArgVariable]: aran.Expression<weave.ResAtom>;
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
      value: aran.Expression<weave.ResAtom>;
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
      label: weave.Label;
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
      variable: aran.Parameter | weave.ArgVariable;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "intrinsic.after";
      name: aran.Intrinsic;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "function.after";
      kind: aran.FunctionKind;
      asynchronous: boolean;
      generator: boolean;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "drop.before";
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "export.before";
      specifier: string;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "write.before";
      variable: aran.Parameter | weave.ArgVariable;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Branch //
  | {
      type: "branch.before";
      kind: BranchKind;
      value: aran.Expression<weave.ResAtom>;
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
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "conditional.after";
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  // Eval //
  | {
      type: "eval.before";
      value: aran.Expression<weave.ResAtom>;
      context: EvalContext;
      location: L;
    }
  | {
      type: "eval.after";
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  // Await //
  | {
      type: "await.before";
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "await.after";
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: aran.Expression<weave.ResAtom>;
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
      value: aran.Expression<weave.ResAtom>;
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
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  // write-external //
  | {
      type: "global.write.before";
      variable: estree.Variable;
      value: aran.Expression<weave.ResAtom>;
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
      kind: aran.VariableKind;
      variable: estree.Variable;
      value: aran.Expression<weave.ResAtom>;
      location: L;
    }
  | {
      type: "global.declare.after";
      kind: aran.VariableKind;
      variable: estree.Variable;
      location: L;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: aran.Expression<weave.ResAtom>;
      this: aran.Expression<weave.ResAtom>;
      arguments: aran.Expression<weave.ResAtom>[];
      location: L;
    }
  | {
      type: "construct";
      callee: aran.Expression<weave.ResAtom>;
      arguments: aran.Expression<weave.ResAtom>[];
      location: L;
    };

type FunctionPointcut<L> = (point: Point<L>) => boolean;

type IterablePointcut = Iterable<TrapName>;

export type ObjectPointcut<L> = {
  // program //
  "program.enter"?:
    | boolean
    | ((
        kind: aran.ProgramKind,
        links: LinkData[],
        frame: { [key in weave.ArgVariable]?: null },
        location: L,
      ) => boolean);
  "program.completion"?:
    | boolean
    | ((kind: aran.ProgramKind, value: null, location: L) => boolean);
  "program.failure"?:
    | boolean
    | ((kind: aran.ProgramKind, error: null, location: L) => boolean);
  "program.leave"?:
    | boolean
    | ((kind: aran.ProgramKind, location: L) => boolean);
  // function //
  "function.enter"?:
    | boolean
    | ((
        kind: aran.FunctionKind,
        callee: null,
        frame: { [key in weave.ArgVariable]?: null },
        location: L,
      ) => boolean);
  "function.completion":
    | boolean
    | ((kind: aran.FunctionKind, value: null, location: L) => boolean);
  "function.failure":
    | boolean
    | ((kind: aran.FunctionKind, error: null, location: L) => boolean);
  "function.leave"?:
    | boolean
    | ((kind: aran.FunctionKind, location: L) => boolean);
  // block //
  "block.enter"?:
    | boolean
    | ((
        kind: BlockKind,
        labels: weave.Label[],
        frame: { [key in weave.ArgVariable]?: null },
        location: L,
      ) => boolean);
  "block.completion": boolean | ((kind: BlockKind, location: L) => boolean);
  "block.failure":
    | boolean
    | ((kind: BlockKind, error: null, location: L) => boolean);
  "block.leave"?: boolean | ((kind: BlockKind, location: L) => boolean);
  // debugger //
  "debugger.before"?: boolean | ((location: L) => boolean);
  "debugger.after"?: boolean | ((location: L) => boolean);
  // break //
  "break.before"?: boolean | ((label: weave.Label, location: L) => boolean);
  // branch //
  "branch.before"?:
    | boolean
    | ((kind: BranchKind, value: null, location: L) => boolean);
  "branch.after"?: boolean | ((kind: BranchKind, location: L) => boolean);
  // producer //
  "intrinsic.after"?:
    | boolean
    | ((name: aran.Intrinsic, value: null, location: L) => boolean);
  "primitive.after"?: boolean | ((value: Primitive, location: L) => boolean);
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
        kind: aran.FunctionKind,
        asynchronous: boolean,
        generator: boolean,
        value: null,
        location: L,
      ) => boolean);
  "read.after"?:
    | boolean
    | ((
        variable: aran.Parameter | weave.ArgVariable,
        value: null,
        location: L,
      ) => boolean);
  // conditional //
  "conditional.before"?: boolean | ((value: null, location: L) => boolean);
  "conditional.after"?: boolean | ((value: null, location: L) => boolean);
  // eval //
  "eval.before"?:
    | boolean
    | ((value: null, context: EvalContext, location: L) => boolean);
  "eval.after"?: boolean | ((value: null, location: L) => boolean);
  // await //
  "await.before"?: boolean | ((value: null, location: L) => boolean);
  "await.after"?: boolean | ((value: null, location: L) => boolean);
  // yield //
  "yield.before"?:
    | boolean
    | ((delegate: boolean, value: null, location: L) => boolean);
  "yield.after"?:
    | boolean
    | ((delegate: boolean, value: null, location: L) => boolean);
  // consumer //
  "drop.before"?: boolean | ((value: null, location: L) => boolean);
  "export.before"?:
    | boolean
    | ((specifier: string, value: null, location: L) => boolean);
  "write.before"?:
    | boolean
    | ((
        variable: aran.Parameter | weave.ArgVariable,
        value: null,
        location: L,
      ) => boolean);
  "return.before"?: boolean | ((value: null, location: L) => boolean);
  // apply //
  "apply"?:
    | boolean
    | ((callee: null, this_: null, arguments_: null[], location: L) => boolean);
  // construct //
  "construct"?:
    | boolean
    | ((callee: null, arguments_: null[], location: L) => boolean);
  // global //
  "global.read.before"?:
    | boolean
    | ((variable: estree.Variable, location: L) => boolean);
  "global.read.after"?:
    | boolean
    | ((variable: estree.Variable, value: null, location: L) => boolean);
  "global.typeof.before"?:
    | boolean
    | ((variable: estree.Variable, location: L) => boolean);
  "global.typeof.after"?:
    | boolean
    | ((variable: estree.Variable, value: null, location: L) => boolean);
  "global.write.before"?:
    | boolean
    | ((variable: estree.Variable, value: null, location: L) => boolean);
  "global.write.after"?:
    | boolean
    | ((variable: estree.Variable, location: L) => boolean);
  "global.declare.before"?:
    | boolean
    | ((
        kind: aran.VariableKind,
        variable: estree.Variable,
        value: null,
        location: L,
      ) => boolean);
  "global.declare.after"?:
    | boolean
    | ((
        kind: aran.VariableKind,
        variable: estree.Variable,
        location: L,
      ) => boolean);
};

export type TrapName = keyof ObjectPointcut<any>;

type ConstantPointcut = boolean;

export type Pointcut<S> =
  | FunctionPointcut<S>
  | IterablePointcut
  | ObjectPointcut<S>
  | ConstantPointcut;
