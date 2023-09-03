type TestKind = "conditional" | "if" | "while";

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
  | "parameter.after"
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

type Point<T, S, L, V> =
  //////////////
  // Informer //
  //////////////
  // Program //
  | {
      type: "program.enter";
      kind: ProgramKind;
      links: Link[];
      parameters: Expression<T>;
      variables: V[];
      serial: S;
    }
  | {
      type: "program.completion";
      kind: ProgramKind;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "program.failure";
      kind: ProgramKind;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "program.leave";
      kind: ProgramKind;
      serial: S;
    }
  // closure //
  | {
      type: "closure.enter";
      kind: ClosureKind;
      callee: Expression<T>;
      parameters: Expression<T>;
      variables: V[];
      serial: S;
    }
  | {
      type: "closure.completion";
      kind: ClosureKind;
      serial: S;
      value: Expression<T>;
    }
  | {
      type: "closure.failure";
      kind: ClosureKind;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "closure.leave";
      kind: ClosureKind;
      serial: S;
    }
  // Block //
  | {
      type: "block.enter";
      kind: BlockKind;
      labels: L[];
      parameters: Expression<T>;
      variables: V[];
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
      value: Expression<T>;
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
      label: L;
      serial: S;
    }
  // If && While
  | {
      type: "test.before";
      kind: TestKind;
      value: Expression<T>;
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
      type: "parameter.after";
      name: Parameter;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "intrinsic.after";
      name: Intrinsic;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "closure.after";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "read.after";
      variable: V;
      value: Expression<T>;
      serial: S;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "drop.before";
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "export.before";
      specifier: string;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "write.before";
      variable: V;
      value: Expression<T>;
      serial: S;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Conditional //
  | {
      type: "conditional.before";
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "conditional.after";
      value: Expression<T>;
      serial: S;
    }
  // Eval //
  | {
      type: "eval.before";
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "eval.after";
      value: Expression<T>;
      serial: S;
    }
  // Await //
  | {
      type: "await.before";
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "await.after";
      value: Expression<T>;
      serial: S;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: Expression<T>;
      serial: S;
    }
  // read-external //
  | {
      type: "enclave.read.before";
      variable: string;
      serial: S;
    }
  | {
      type: "enclave.read.after";
      variable: string;
      value: Expression<T>;
      serial: S;
    }
  // typeof-external //
  | {
      type: "enclave.typeof.before";
      variable: string;
      serial: S;
    }
  | {
      type: "enclave.typeof.after";
      variable: string;
      value: Expression<T>;
      serial: S;
    }
  // write-external //
  | {
      type: "enclave.write.before";
      variable: string;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "enclave.write.after";
      variable: string;
      serial: S;
    }
  // declare-external //
  | {
      type: "enclave.declare.before";
      kind: VariableKind;
      variable: string;
      value: Expression<T>;
      serial: S;
    }
  | {
      type: "enclave.declare.after";
      kind: VariableKind;
      variable: string;
      serial: S;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: Expression<T>;
      this: Expression<T>;
      arguments: Expression<T>[];
      serial: S;
    }
  | {
      type: "construct";
      callee: Expression<T>;
      arguments: Expression<T>[];
      serial: S;
    };

type FunctionPointcut<T, S, L, V> = (point: Point<T, S, L, V>) => boolean;

type IterablePointcut = Iterable<TrapName>;

type ObjectPointcut<S, L, V> = {
  // Program //
  "program.enter"?:
    | boolean
    | ((
        kind: ProgramKind,
        links: Link[],
        parameters: null,
        variables: V[],
        serial: S,
      ) => boolean);
  "program.completion"?:
    | boolean
    | ((kind: ProgramKind, value: null, serial: S) => boolean);
  "program.failure"?:
    | boolean
    | ((kind: ProgramKind, error: null, serial: S) => boolean);
  "program.leave"?: boolean | ((kind: ProgramKind, serial: S) => boolean);
  // Closure //
  "closure.enter"?:
    | boolean
    | ((
        kind: ClosureKind,
        callee: null,
        parameters: null,
        variables: V[],
        serial: S,
      ) => boolean);
  "closure.completion":
    | boolean
    | ((kind: ClosureKind, value: null, serial: S) => boolean);
  "closure.failure":
    | boolean
    | ((kind: ClosureKind, error: null, serial: S) => boolean);
  "closure.leave"?: boolean | ((kind: ClosureKind, serial: S) => boolean);
  // Block //
  "block.enter"?:
    | boolean
    | ((
        kind: BlockKind,
        labels: L[],
        parameters: null,
        variables: V[],
        serial: S,
      ) => boolean);
  "block.completion": boolean | ((kind: BlockKind, serial: S) => boolean);
  "block.failure":
    | boolean
    | ((kind: BlockKind, error: null, serial: S) => boolean);
  "block.leave"?: boolean | ((kind: BlockKind, serial: S) => boolean);
  "debugger.before"?: boolean | ((serial: S) => boolean);
  "debugger.after"?: boolean | ((serial: S) => boolean);
  "break.before"?: boolean | ((label: L, serial: S) => boolean);
  "test.before"?:
    | boolean
    | ((kind: TestKind, value: null, serial: S) => boolean);
  "parameter.after"?:
    | boolean
    | ((name: Parameter, value: null, serial: S) => boolean);
  "intrinsic.after"?:
    | boolean
    | ((name: Intrinsic, value: null, serial: S) => boolean);
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
        kind: ClosureKind,
        asynchronous: boolean,
        generator: boolean,
        value: null,
        serial: S,
      ) => boolean);
  "read.after"?: boolean | ((variable: V, value: null, serial: S) => boolean);
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
  "write.before"?: boolean | ((variable: V, value: null, serial: S) => boolean);
  "return.before"?: boolean | ((value: null, serial: S) => boolean);
  "apply"?:
    | boolean
    | ((callee: null, this_: null, arguments_: null[], serial: S) => boolean);
  "construct"?:
    | boolean
    | ((callee: null, arguments_: null[], serial: S) => boolean);
  "enclave.read.before"?: boolean | ((variable: string, serial: S) => boolean);
  "enclave.read.after"?:
    | boolean
    | ((variable: string, value: null, serial: S) => boolean);
  "enclave.typeof.before"?:
    | boolean
    | ((variable: string, serial: S) => boolean);
  "enclave.typeof.after"?:
    | boolean
    | ((variable: string, value: null, serial: S) => boolean);
  "enclave.write.before"?:
    | boolean
    | ((variable: string, value: null, serial: S) => boolean);
  "enclave.write.after"?: boolean | ((variable: string, serial: S) => boolean);
  "enclave.declare.before"?:
    | boolean
    | ((
        kind: VariableKind,
        variable: string,
        value: null,
        serial: S,
      ) => boolean);
  "enclave.declare.after"?:
    | boolean
    | ((kind: VariableKind, variable: string, serial: S) => boolean);
};

type ConstantPointcut = boolean;

type Pointcut<T, S, L, V> =
  | FunctionPointcut<T, S, L, V>
  | IterablePointcut
  | ObjectPointcut<S, L, V>
  | ConstantPointcut;
