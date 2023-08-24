type DeclareKind = "var" | "let" | "const";

type ProgramKind = "module" | "script" | "eval";

type TestKind = "conditional" | "if" | "while";

type BlockKind =
  | "try"
  | "catch"
  | "finally"
  | "then"
  | "else"
  | "while"
  | "naked";

type LinkData =
  | {
      type: "import";
      source: string;
      import: string | null;
    }
  | {
      type: "export";
      export: string;
    }
  | {
      type: "aggregate";
      source: string;
      import: string | null;
      export: string | null;
    };

//////////////
// Pointcut //
//////////////

type TrapName =
  | "program.before"
  | "program.after"
  | "block.enter"
  | "block.success"
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
  | "test.before"
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

type Point =
  //////////////
  // Informer //
  //////////////
  // Program //
  | {
      type: "eval.enter";
      parameters: Partial<Record<Parameter, Expression>>;
      variables: Json[];
      serial: Json;
    }
  | {
      type: "eval.success";
      value: Expression;
      serial: Json;
    }
  | {
      type: "eval.failure";
      value: Expression;
      serial: Json;
    }
  | {
      type: "eval.leave";
      serial: Json;
    }
  | {
      type: "module.enter";
      links: LinkData[];
      parameters: Partial<Record<Parameter, Expression>>;
      variables: Json[];
      serial: Json;
    }
  | {
      type: "module.success";
      serial: Json;
    }
  | {
      type: "module.failure";
      value: Expression;
      serial: Json;
    }
  | {
      type: "module.leave";
      serial: Json;
    }
  | {
      type: "script.before";
      parameters: Partial<Record<Parameter, Expression>>;
      serial: Json;
    }
  | {
      type: "script.after";
      value: Expression;
      serial: Json;
    }
  // closure //
  | {
      type: "closure.enter";
      kind: ClosureKind;
      callee: Expression;
      parameters: Partial<Record<Parameter, Expression>>;
      variables: Json[];
      serial: Json;
    }
  | {
      type: "closure.failure";
      value: Expression;
      serial: Json;
    }
  | {
      type: "closure.success";
      serial: Json;
    }
  | {
      type: "closure.leave";
      serial: Json;
    }
  // Block //
  | {
      type: "block.enter";
      kind: BlockKind;
      parameters: Partial<Record<Parameter, Expression>>;
      labels: Json[];
      variables: Json[];
      serial: Json;
    }
  | {
      type: "block.failure";
      value: Expression;
      serial: Json;
    }
  | {
      type: "block.success";
      serial: Json;
    }
  | {
      type: "block.leave";
      serial: Json;
    }
  // Debugger //
  | {
      type: "debugger.before";
      serial: Json;
    }
  | {
      type: "debugger.after";
      serial: Json;
    }
  // Break //
  | {
      type: "break.before";
      label: Json;
      serial: Json;
    }
  // If && While
  | {
      type: "test.before";
      kind: TestKind;
      value: Expression;
      serial: Json;
    }
  ///////////////////
  // Pure Producer //
  ///////////////////
  | {
      type: "primitive.after";
      value: Primitive;
      serial: Json;
    }
  | {
      type: "parameter.after";
      name: Parameter;
      value: Expression;
      serial: Json;
    }
  | {
      type: "intrinsic.after";
      name: Intrinsic;
      value: Expression;
      serial: Json;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: Expression;
      serial: Json;
    }
  | {
      type: "closure.after";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      value: Expression;
      serial: Json;
    }
  | {
      type: "read.after";
      variable: Json;
      value: Expression;
      serial: Json;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: Expression;
      serial: Json;
    }
  | {
      type: "drop.before";
      value: Expression;
      serial: Json;
    }
  | {
      type: "export.before";
      specifier: string;
      value: Expression;
      serial: Json;
    }
  | {
      type: "write.before";
      variable: Json;
      value: Expression;
      serial: Json;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Conditional //
  | {
      type: "conditional.before";
      value: Expression;
      serial: Json;
    }
  | {
      type: "conditional.after";
      value: Expression;
      serial: Json;
    }
  // Eval //
  | {
      type: "eval.before";
      value: Expression;
      serial: Json;
    }
  | {
      type: "eval.after";
      value: Expression;
      serial: Json;
    }
  // Await //
  | {
      type: "await.before";
      value: Expression;
      serial: Json;
    }
  | {
      type: "await.after";
      value: Expression;
      serial: Json;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: Expression;
      serial: Json;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: Expression;
      serial: Json;
    }
  // read-external //
  | {
      type: "enclave.read.before";
      variable: string;
      serial: Json;
    }
  | {
      type: "enclave.read.after";
      variable: string;
      value: Expression;
      serial: Json;
    }
  // typeof-external //
  | {
      type: "enclave.typeof.before";
      variable: string;
      serial: Json;
    }
  | {
      type: "enclave.typeof.after";
      variable: string;
      value: Expression;
      serial: Json;
    }
  // write-external //
  | {
      type: "enclave.write.before";
      variable: string;
      value: Expression;
      serial: Json;
    }
  | {
      type: "enclave.write.after";
      variable: string;
      serial: Json;
    }
  // declare-external //
  | {
      type: "enclave.declare.before";
      kind: VariableKind;
      variable: string;
      value: Expression;
      serial: Json;
    }
  | {
      type: "enclave.declare.after";
      kind: VariableKind;
      variable: string;
      serial: Json;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: Expression;
      this: Expression;
      arguments: Expression[];
      serial: Json;
    }
  | {
      type: "construct";
      callee: Expression;
      arguments: Expression[];
      serial: Json;
    };

type FunctionPointcut = (point: Point) => boolean;

type IterablePointcut = Iterable<TrapName>;

type ObjectPointcut = {
  "eval.enter"?:
    | boolean
    | ((
        parameters: Partial<Record<Parameter, null>>,
        variables: Json[],
        serial: Json,
      ) => boolean);
  "eval.success"?: boolean | ((value: null, serial: Json) => boolean);
  "eval.failure"?: boolean | ((error: null, serial: Json) => boolean);
  "eval.leave"?: boolean | ((serial: Json) => boolean);
  "module.enter"?:
    | boolean
    | ((
        links: LinkData[],
        parameters: Partial<Record<Parameter, null>>,
        variables: Json[],
        serial: Json,
      ) => boolean);
  "module.success"?: boolean | ((serial: Json) => boolean);
  "module.failure"?: boolean | ((error: null, serial: Json) => boolean);
  "module.leave"?: boolean | ((serial: Json) => boolean);
  "script.before"?:
    | boolean
    | ((parameters: Partial<Record<Parameter, null>>, serial: Json) => boolean);
  "script.after"?: boolean | ((value: null, serial: Json) => boolean);
  "closure.enter"?:
    | boolean
    | ((
        kind: ClosureKind,
        callee: null,
        parameters: Partial<Record<Parameter, null>>,
        variables: Json[],
        serial: Json,
      ) => boolean);
  "closure.success": boolean | ((serial: Json) => boolean);
  "closure.failure": boolean | ((error: null, serial: Json) => boolean);
  "closure.leave"?: boolean | ((serial: Json) => boolean);
  "block.enter"?:
    | boolean
    | ((
        kind: BlockKind,
        parameters: Partial<Record<Parameter, null>>,
        labels: Json[],
        variables: Json[],
        serial: Json,
      ) => boolean);
  "block.success": boolean | ((serial: Json) => boolean);
  "block.failure": boolean | ((error: null, serial: Json) => boolean);
  "block.leave"?: boolean | ((serial: Json) => boolean);
  "debugger.before"?: boolean | ((serial: Json) => boolean);
  "debugger.after"?: boolean | ((serial: Json) => boolean);
  "break.before"?: boolean | ((label: Json, serial: Json) => boolean);
  "test.before"?:
    | boolean
    | ((kind: TestKind, value: null, serial: Json) => boolean);
  "parameter.after"?:
    | boolean
    | ((name: Parameter, value: null, serial: Json) => boolean);
  "intrinsic.after"?:
    | boolean
    | ((name: Intrinsic, value: null, serial: Json) => boolean);
  "primitive.after"?: boolean | ((value: Primitive, serial: Json) => boolean);
  "import.after"?:
    | boolean
    | ((
        source: string,
        specifier: string | null,
        value: null,
        serial: Json,
      ) => boolean);
  "closure.after"?:
    | boolean
    | ((
        kind: ClosureKind,
        asynchronous: boolean,
        generator: boolean,
        value: null,
        serial: Json,
      ) => boolean);
  "read.after"?:
    | boolean
    | ((variable: Json, value: null, serial: Json) => boolean);
  "conditional.before"?: boolean | ((value: null, serial: Json) => boolean);
  "conditional.after"?: boolean | ((value: null, serial: Json) => boolean);
  "eval.before"?: boolean | ((value: null, serial: Json) => boolean);
  "eval.after"?: boolean | ((value: null, serial: Json) => boolean);
  "await.before"?: boolean | ((value: null, serial: Json) => boolean);
  "await.after"?: boolean | ((value: null, serial: Json) => boolean);
  "yield.before"?:
    | boolean
    | ((delegate: boolean, value: null, serial: Json) => boolean);
  "yield.after"?:
    | boolean
    | ((delegate: boolean, value: null, serial: Json) => boolean);
  "drop.before"?: boolean | ((value: null, serial: Json) => boolean);
  "export.before"?:
    | boolean
    | ((specifier: string, value: null, serial: Json) => boolean);
  "write.before"?:
    | boolean
    | ((variable: Json, value: null, serial: Json) => boolean);
  "return.before"?: boolean | ((value: null, serial: Json) => boolean);
  "apply"?:
    | boolean
    | ((
        callee: null,
        this_: null,
        arguments_: null[],
        serial: Json,
      ) => boolean);
  "construct"?:
    | boolean
    | ((callee: null, arguments_: null[], serial: Json) => boolean);
  "enclave.read.before"?:
    | boolean
    | ((variable: string, serial: Json) => boolean);
  "enclave.read.after"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "enclave.typeof.before"?:
    | boolean
    | ((variable: string, serial: Json) => boolean);
  "enclave.typeof.after"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "enclave.write.before"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "enclave.write.after"?:
    | boolean
    | ((variable: string, serial: Json) => boolean);
  "enclave.declare.before"?:
    | boolean
    | ((
        kind: DeclareKind,
        variable: string,
        value: null,
        serial: Json,
      ) => boolean);
  "enclave.declare.after"?:
    | boolean
    | ((kind: DeclareKind, variable: string, serial: Json) => boolean);
};

type ConstantPointcut = boolean;

type Pointcut =
  | FunctionPointcut
  | IterablePointcut
  | ObjectPointcut
  | ConstantPointcut;
