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

type TrapName =
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
  | "intrinsic.after"
  | "primitive.after"
  | "import.after"
  | "closure.after"
  | "read.after"
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
  | "construct"
  | "enclave.read.before"
  | "enclave.read.after"
  | "enclave.typeof.before"
  | "enclave.typeof.after"
  | "enclave.write.before"
  | "enclave.write.after"
  | "enclave.declare.before"
  | "enclave.declare.after";

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
        [key in aran.Parameter | unbuild.Variable]: weave.Expression;
      };
      serial: S;
    }
  | {
      type: "program.completion";
      kind: aran.ProgramKind;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "program.failure";
      kind: aran.ProgramKind;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "program.leave";
      kind: aran.ProgramKind;
      serial: S;
    }
  // closure //
  | {
      type: "closure.enter";
      kind: aran.ClosureKind;
      callee: weave.Expression;
      frame: { [key in aran.Parameter | unbuild.Variable]: weave.Expression };
      serial: S;
    }
  | {
      type: "closure.completion";
      kind: aran.ClosureKind;
      serial: S;
      value: weave.Expression;
    }
  | {
      type: "closure.failure";
      kind: aran.ClosureKind;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "closure.leave";
      kind: aran.ClosureKind;
      serial: S;
    }
  // Block //
  | {
      type: "block.enter";
      kind: BlockKind;
      labels: aran.Label[];
      frame: { [key in aran.Parameter | unbuild.Variable]: weave.Expression };
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
      value: weave.Expression;
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
      label: aran.Label;
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
      variable: aran.Parameter | unbuild.Variable;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "intrinsic.after";
      name: aran.Intrinsic;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "closure.after";
      kind: aran.ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      value: weave.Expression;
      serial: S;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "drop.before";
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "export.before";
      specifier: string;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "write.before";
      variable: aran.Parameter | unbuild.Variable;
      value: weave.Expression;
      serial: S;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Branch //
  | {
      type: "branch.before";
      kind: BranchKind;
      value: weave.Expression;
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
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "conditional.after";
      value: weave.Expression;
      serial: S;
    }
  // Eval //
  | {
      type: "eval.before";
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "eval.after";
      value: weave.Expression;
      serial: S;
    }
  // Await //
  | {
      type: "await.before";
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "await.after";
      value: weave.Expression;
      serial: S;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: weave.Expression;
      serial: S;
    }
  // read-external //
  | {
      type: "enclave.read.before";
      variable: estree.Variable;
      serial: S;
    }
  | {
      type: "enclave.read.after";
      variable: estree.Variable;
      value: weave.Expression;
      serial: S;
    }
  // typeof-external //
  | {
      type: "enclave.typeof.before";
      variable: estree.Variable;
      serial: S;
    }
  | {
      type: "enclave.typeof.after";
      variable: estree.Variable;
      value: weave.Expression;
      serial: S;
    }
  // write-external //
  | {
      type: "enclave.write.before";
      variable: estree.Variable;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "enclave.write.after";
      variable: estree.Variable;
      serial: S;
    }
  // declare-external //
  | {
      type: "enclave.declare.before";
      kind: aran.VariableKind;
      variable: estree.Variable;
      value: weave.Expression;
      serial: S;
    }
  | {
      type: "enclave.declare.after";
      kind: aran.VariableKind;
      variable: estree.Variable;
      serial: S;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: weave.Expression;
      this: weave.Expression;
      arguments: weave.Expression[];
      serial: S;
    }
  | {
      type: "construct";
      callee: weave.Expression;
      arguments: weave.Expression[];
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
        frame: { [key in unbuild.Variable]?: null },
        serial: S,
      ) => boolean);
  "program.completion"?:
    | boolean
    | ((kind: aran.ProgramKind, value: null, serial: S) => boolean);
  "program.failure"?:
    | boolean
    | ((kind: aran.ProgramKind, error: null, serial: S) => boolean);
  "program.leave"?: boolean | ((kind: aran.ProgramKind, serial: S) => boolean);
  // Closure //
  "closure.enter"?:
    | boolean
    | ((
        kind: aran.ClosureKind,
        callee: null,
        frame: { [key in unbuild.Variable]?: null },
        serial: S,
      ) => boolean);
  "closure.completion":
    | boolean
    | ((kind: aran.ClosureKind, value: null, serial: S) => boolean);
  "closure.failure":
    | boolean
    | ((kind: aran.ClosureKind, error: null, serial: S) => boolean);
  "closure.leave"?: boolean | ((kind: aran.ClosureKind, serial: S) => boolean);
  // Block //
  "block.enter"?:
    | boolean
    | ((
        kind: BlockKind,
        labels: aran.Label[],
        frame: { [key in unbuild.Variable]?: null },
        serial: S,
      ) => boolean);
  "block.completion": boolean | ((kind: BlockKind, serial: S) => boolean);
  "block.failure":
    | boolean
    | ((kind: BlockKind, error: null, serial: S) => boolean);
  "block.leave"?: boolean | ((kind: BlockKind, serial: S) => boolean);
  "debugger.before"?: boolean | ((serial: S) => boolean);
  "debugger.after"?: boolean | ((serial: S) => boolean);
  "break.before"?: boolean | ((label: aran.Label, serial: S) => boolean);
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
  "closure.after"?:
    | boolean
    | ((
        kind: aran.ClosureKind,
        asynchronous: boolean,
        generator: boolean,
        value: null,
        serial: S,
      ) => boolean);
  "read.after"?:
    | boolean
    | ((
        variable: aran.Parameter | unbuild.Variable,
        value: null,
        serial: S,
      ) => boolean);
  "conditional.before"?: boolean | ((value: null, serial: S) => boolean);
  "conditional.after"?: boolean | ((value: null, serial: S) => boolean);
  "eval.before"?: boolean | ((value: null, serial: S) => boolean);
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
        variable: aran.Parameter | unbuild.Variable,
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
  "enclave.read.before"?:
    | boolean
    | ((variable: estree.Variable, serial: S) => boolean);
  "enclave.read.after"?:
    | boolean
    | ((variable: estree.Variable, value: null, serial: S) => boolean);
  "enclave.typeof.before"?:
    | boolean
    | ((variable: estree.Variable, serial: S) => boolean);
  "enclave.typeof.after"?:
    | boolean
    | ((variable: estree.Variable, value: null, serial: S) => boolean);
  "enclave.write.before"?:
    | boolean
    | ((variable: estree.Variable, value: null, serial: S) => boolean);
  "enclave.write.after"?:
    | boolean
    | ((variable: estree.Variable, serial: S) => boolean);
  "enclave.declare.before"?:
    | boolean
    | ((
        kind: aran.VariableKind,
        variable: estree.Variable,
        value: null,
        serial: S,
      ) => boolean);
  "enclave.declare.after"?:
    | boolean
    | ((
        kind: aran.VariableKind,
        variable: estree.Variable,
        serial: S,
      ) => boolean);
};

type ConstantPointcut = boolean;

export type Pointcut<S> =
  | FunctionPointcut<S>
  | IterablePointcut
  | ObjectPointcut<S>
  | ConstantPointcut;
