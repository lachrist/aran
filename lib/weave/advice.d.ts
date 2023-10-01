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

export type Point<S> =
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
      serial: S;
    }
  | {
      type: "program.completion";
      kind: aran.ProgramKind;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "program.failure";
      kind: aran.ProgramKind;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "program.leave";
      kind: aran.ProgramKind;
      serial: S;
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
      serial: S;
    }
  | {
      type: "function.completion";
      kind: aran.FunctionKind;
      serial: S;
      value: aran.Expression<weave.ResAtom>;
    }
  | {
      type: "function.failure";
      kind: aran.FunctionKind;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "function.leave";
      kind: aran.FunctionKind;
      serial: S;
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
      serial: S;
    }
  | {
      type: "block.completion";
      kind: BlockKind;
      serial: S;
    }
  | {
      type: "block.failure";
      kind: BlockKind;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "block.leave";
      kind: BlockKind;
      serial: S;
    }
  // Debugger //
  | {
      type: "debugger.before";
      serial: S;
    }
  | {
      type: "debugger.after";
      serial: S;
    }
  // Break //
  | {
      type: "break.before";
      label: weave.Label;
      serial: S;
    }
  ///////////////////
  // Pure Producer //
  ///////////////////
  | {
      type: "primitive.after";
      value: Primitive;
      serial: S;
    }
  | {
      type: "read.after";
      variable: aran.Parameter | weave.ArgVariable;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "intrinsic.after";
      name: aran.Intrinsic;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "function.after";
      kind: aran.FunctionKind;
      asynchronous: boolean;
      generator: boolean;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "drop.before";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "export.before";
      specifier: string;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "write.before";
      variable: aran.Parameter | weave.ArgVariable;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Branch //
  | {
      type: "branch.before";
      kind: BranchKind;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "branch.after";
      kind: BranchKind;
      serial: S;
    }
  // Conditional //
  | {
      type: "conditional.before";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "conditional.after";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  // Eval //
  | {
      type: "eval.before";
      value: aran.Expression<weave.ResAtom>;
      context: EvalContext;
      serial: S;
    }
  | {
      type: "eval.after";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  // Await //
  | {
      type: "await.before";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "await.after";
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  // read-external //
  | {
      type: "global.read.before";
      variable: estree.Variable;
      serial: S;
    }
  | {
      type: "global.read.after";
      variable: estree.Variable;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  // typeof-external //
  | {
      type: "global.typeof.before";
      variable: estree.Variable;
      serial: S;
    }
  | {
      type: "global.typeof.after";
      variable: estree.Variable;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  // write-external //
  | {
      type: "global.write.before";
      variable: estree.Variable;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "global.write.after";
      variable: estree.Variable;
      serial: S;
    }
  // declare-external //
  | {
      type: "global.declare.before";
      kind: aran.VariableKind;
      variable: estree.Variable;
      value: aran.Expression<weave.ResAtom>;
      serial: S;
    }
  | {
      type: "global.declare.after";
      kind: aran.VariableKind;
      variable: estree.Variable;
      serial: S;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: aran.Expression<weave.ResAtom>;
      this: aran.Expression<weave.ResAtom>;
      arguments: aran.Expression<weave.ResAtom>[];
      serial: S;
    }
  | {
      type: "construct";
      callee: aran.Expression<weave.ResAtom>;
      arguments: aran.Expression<weave.ResAtom>[];
      serial: S;
    };

type FunctionPointcut<S> = (point: Point<S>) => boolean;

type IterablePointcut = Iterable<TrapName>;

export type ObjectPointcut<S> = {
  // Program //
  "program.enter"?:
    | boolean
    | ((
        kind: aran.ProgramKind,
        links: LinkData[],
        frame: { [key in weave.ArgVariable]?: null },
        serial: S,
      ) => boolean);
  "program.completion"?:
    | boolean
    | ((kind: aran.ProgramKind, value: null, serial: S) => boolean);
  "program.failure"?:
    | boolean
    | ((kind: aran.ProgramKind, error: null, serial: S) => boolean);
  "program.leave"?: boolean | ((kind: aran.ProgramKind, serial: S) => boolean);
  // Function //
  "function.enter"?:
    | boolean
    | ((
        kind: aran.FunctionKind,
        callee: null,
        frame: { [key in weave.ArgVariable]?: null },
        serial: S,
      ) => boolean);
  "function.completion":
    | boolean
    | ((kind: aran.FunctionKind, value: null, serial: S) => boolean);
  "function.failure":
    | boolean
    | ((kind: aran.FunctionKind, error: null, serial: S) => boolean);
  "function.leave"?:
    | boolean
    | ((kind: aran.FunctionKind, serial: S) => boolean);
  // Block //
  "block.enter"?:
    | boolean
    | ((
        kind: BlockKind,
        labels: weave.Label[],
        frame: { [key in weave.ArgVariable]?: null },
        serial: S,
      ) => boolean);
  "block.completion": boolean | ((kind: BlockKind, serial: S) => boolean);
  "block.failure":
    | boolean
    | ((kind: BlockKind, error: null, serial: S) => boolean);
  "block.leave"?: boolean | ((kind: BlockKind, serial: S) => boolean);
  "debugger.before"?: boolean | ((serial: S) => boolean);
  "debugger.after"?: boolean | ((serial: S) => boolean);
  "break.before"?: boolean | ((label: weave.Label, serial: S) => boolean);
  "branch.before"?:
    | boolean
    | ((kind: BranchKind, value: null, serial: S) => boolean);
  "branch.after"?: boolean | ((kind: BranchKind, serial: S) => boolean);
  "intrinsic.after"?:
    | boolean
    | ((name: aran.Intrinsic, value: null, serial: S) => boolean);
  "primitive.after"?: boolean | ((value: Primitive, serial: S) => boolean);
  "import.after"?:
    | boolean
    | ((
        source: string,
        specifier: string | null,
        value: null,
        serial: S,
      ) => boolean);
  "function.after"?:
    | boolean
    | ((
        kind: aran.FunctionKind,
        asynchronous: boolean,
        generator: boolean,
        value: null,
        serial: S,
      ) => boolean);
  "read.after"?:
    | boolean
    | ((
        variable: aran.Parameter | weave.ArgVariable,
        value: null,
        serial: S,
      ) => boolean);
  "conditional.before"?: boolean | ((value: null, serial: S) => boolean);
  "conditional.after"?: boolean | ((value: null, serial: S) => boolean);
  "eval.before"?:
    | boolean
    | ((value: null, context: EvalContext, serial: S) => boolean);
  "eval.after"?: boolean | ((value: null, serial: S) => boolean);
  "await.before"?: boolean | ((value: null, serial: S) => boolean);
  "await.after"?: boolean | ((value: null, serial: S) => boolean);
  "yield.before"?:
    | boolean
    | ((delegate: boolean, value: null, serial: S) => boolean);
  "yield.after"?:
    | boolean
    | ((delegate: boolean, value: null, serial: S) => boolean);
  "drop.before"?: boolean | ((value: null, serial: S) => boolean);
  "export.before"?:
    | boolean
    | ((specifier: string, value: null, serial: S) => boolean);
  "write.before"?:
    | boolean
    | ((
        variable: aran.Parameter | weave.ArgVariable,
        value: null,
        serial: S,
      ) => boolean);
  "return.before"?: boolean | ((value: null, serial: S) => boolean);
  "apply"?:
    | boolean
    | ((callee: null, this_: null, arguments_: null[], serial: S) => boolean);
  "construct"?:
    | boolean
    | ((callee: null, arguments_: null[], serial: S) => boolean);
  "global.read.before"?:
    | boolean
    | ((variable: estree.Variable, serial: S) => boolean);
  "global.read.after"?:
    | boolean
    | ((variable: estree.Variable, value: null, serial: S) => boolean);
  "global.typeof.before"?:
    | boolean
    | ((variable: estree.Variable, serial: S) => boolean);
  "global.typeof.after"?:
    | boolean
    | ((variable: estree.Variable, value: null, serial: S) => boolean);
  "global.write.before"?:
    | boolean
    | ((variable: estree.Variable, value: null, serial: S) => boolean);
  "global.write.after"?:
    | boolean
    | ((variable: estree.Variable, serial: S) => boolean);
  "global.declare.before"?:
    | boolean
    | ((
        kind: aran.VariableKind,
        variable: estree.Variable,
        value: null,
        serial: S,
      ) => boolean);
  "global.declare.after"?:
    | boolean
    | ((
        kind: aran.VariableKind,
        variable: estree.Variable,
        serial: S,
      ) => boolean);
};

export type TrapName = keyof ObjectPointcut<any>;

type ConstantPointcut = boolean;

export type Pointcut<S> =
  | FunctionPointcut<S>
  | IterablePointcut
  | ObjectPointcut<S>
  | ConstantPointcut;
