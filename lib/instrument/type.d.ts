type ModuleFrame = {
  "type": "module";
  "import.meta": null;
};

type EvalFrame = {
  type: "eval";
};

type ScriptFrame = {
  type: "script";
};

type ProgramFrame = ModuleFrame | EvalFrame | ScriptFrame;

type ClosureFrame =
  | {
      type: "arrow";
      callee: null;
      arguments: null[];
    }
  | {
      "type": "function";
      "callee": null;
      "new.target": null;
      "this": null;
      "arguments": null[];
    }
  | {
      "type": "constructor";
      "callee": null;
      "new.target": null;
      "this": null;
      "arguments": null[];
      "super.get": null;
      "super.set": null;
      "super.call": null;
    }
  | {
      "type": "method";
      "callee": null;
      "this": null;
      "arguments": null[];
      "super.get": null;
      "super.set": null;
    };

type BlockFrame =
  | {
      type: "catch";
      error: null;
    }
  | {
      type: "try" | "finally" | "consequent" | "alternate" | "loop" | "simple";
    };

type ReturnFrame = EvalFrame | ScriptFrame | ClosureFrame;

type CompletionFrame = ModuleFrame | BlockFrame;

type TrapFrame = ProgramFrame | ClosureFrame | BlockFrame;

type LinkData =
  | {
      type: "import";
      source: string;
      specifier: string | null;
    }
  | {
      type: "export";
      specifier: string;
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
  | "enter"
  | "completion"
  | "leave"
  | "debugger"
  | "break"
  | "read-external"
  | "read-typeof"
  | "parameter"
  | "intrinsic"
  | "primitive"
  | "import"
  | "closure"
  | "read"
  | "interrupt"
  | "eval"
  | "await"
  | "yield"
  | "drop"
  | "export"
  | "write"
  | "test"
  | "write-external"
  | "declare-external"
  | "return"
  | "apply"
  | "construct";

type Point =
  | {
      type: "enter";
      frame: TrapFrame;
      links: LinkData[];
      labels: string[];
      variables: string[];
      serial: Json;
    }
  | {
      type: "completion";
      frame: CompletionFrame;
      serial: Json;
    }
  | {
      type: "leave";
      frame: TrapFrame;
      serial: Json;
    }
  | {
      type: "debugger";
      serial: Json;
    }
  | {
      type: "break";
      label: string | null;
      serial: Json;
    }
  | {
      type: "read-external";
      variable: string;
      value: null;
      serial: Json;
    }
  | {
      type: "typeof-external";
      variable: string;
      value: null;
      serial: Json;
    }
  | {
      type: "parameter";
      name: Parameter;
      value: null;
      serial: Json;
    }
  | {
      type: "intrinsic";
      name: Intrinsic;
      value: null;
      serial: Json;
    }
  | {
      type: "primitive";
      value: Primitive;
      serial: Json;
    }
  | {
      type: "import";
      source: string;
      specifier: string | null;
      value: null;
      serial: Json;
    }
  | {
      type: "closure";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      value: null;
      serial: Json;
    }
  | {
      type: "read";
      variable: string;
      value: null;
      serial: Json;
    }
  | {
      type: "interrupt";
      frame: TrapFrame;
      value: null;
      serial: Json;
    }
  | {
      type: "eval";
      value: null;
      serial: Json;
    }
  | {
      type: "await";
      value: null;
      serial: Json;
    }
  | {
      type: "yield";
      delegate: boolean;
      value: null;
      serial: Json;
    }
  | {
      type: "drop";
      value: null;
      serial: Json;
    }
  | {
      type: "export";
      specifier: string;
      value: null;
      serial: Json;
    }
  | {
      type: "write";
      variable: string;
      value: null;
      serial: Json;
    }
  | {
      type: "test";
      value: null;
      serial: Json;
    }
  | {
      type: "write-external";
      variable: string;
      value: null;
      serial: Json;
    }
  | {
      type: "declare-external";
      kind: VariableKind;
      variable: string;
      value: null;
      serial: Json;
    }
  | {
      type: "return";
      frame: ReturnFrame;
      value: null;
      serial: Json;
    }
  | {
      type: "apply";
      callee: null;
      this: null;
      arguments: null[];
      serial: Json;
    }
  | {
      type: "construct";
      callee: null;
      arguments: null[];
      serial: Json;
    };

type FunctionPointcut = (point: Point) => boolean;

type IterablePointcut = Iterable<TrapName>;

type ObjectPointcut = {
  "enter"?:
    | boolean
    | ((
        frame: TrapFrame[],
        links: LinkData[],
        labels: string[],
        variables: string[],
        serial: Json,
      ) => boolean);
  "completion"?: boolean | ((frame: CompletionFrame, serial: Json) => boolean);
  "leave"?: boolean | ((frame: TrapFrame, serial: Json) => boolean);
  "debugger"?: boolean | ((serial: Json) => boolean);
  "break"?: boolean | ((label: string, serial: Json) => boolean);
  "read-external"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "typeof-external"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "parameter"?:
    | boolean
    | ((name: Parameter, value: null, serial: Json) => boolean);
  "intrinsic"?:
    | boolean
    | ((name: Intrinsic, value: null, serial: Json) => boolean);
  "primitive"?: boolean | ((value: Primitive, serial: Json) => boolean);
  "import"?:
    | boolean
    | ((
        source: string,
        specifier: string | null,
        value: null,
        serial: Json,
      ) => boolean);
  "closure"?:
    | boolean
    | ((
        kind: ClosureKind,
        asynchronous: boolean,
        generator: boolean,
        value: null,
        serial: Json,
      ) => boolean);
  "read"?: boolean | ((variable: string, value: null, serial: Json) => boolean);
  "interrupt"?:
    | boolean
    | ((frame: TrapFrame, value: null, serial: Json) => boolean);
  "eval"?: boolean | ((value: null, serial: Json) => boolean);
  "await"?: boolean | ((value: null, serial: Json) => boolean);
  "yield"?:
    | boolean
    | ((delegate: boolean, value: null, serial: Json) => boolean);
  "drop"?: boolean | ((value: null, serial: Json) => boolean);
  "export"?:
    | boolean
    | ((specifier: string, value: null, serial: Json) => boolean);
  "write"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "test"?: boolean | ((value: null, serial: Json) => boolean);
  "write-external"?:
    | boolean
    | ((variable: string, value: null, serial: Json) => boolean);
  "declare-external"?:
    | boolean
    | ((
        kind: VariableKind,
        variable: string,
        value: null,
        serial: Json,
      ) => boolean);
  "return"?:
    | boolean
    | ((frame: ReturnFrame, value: null, serial: Json) => boolean);
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
};

type ConstantPointcut = boolean;

type Pointcut =
  | FunctionPointcut
  | IterablePointcut
  | ObjectPointcut
  | ConstantPointcut;
