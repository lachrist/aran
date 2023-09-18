declare namespace aran {
  type Atom = {
    Label: string;
    Variable: string;
    EnclaveVariable: string;
    Source: string;
    Specifier: string;
    Tag: unknown;
  };

  type Primitive =
    | { undefined: null }
    | null
    | boolean
    | number
    | { bigint: string }
    | string;

  type VariableKind = "var" | "let" | "const";

  type ClosureKind = "arrow" | "function" | "method" | "constructor";

  type ProgramKind = "eval" | "module" | "script";

  type Intrinsic =
    // Ad hoc //
    | "aran.cache"
    | "aran.record.variables"
    | "aran.record.values"
    | "aran.global"
    | "aran.unary"
    | "aran.binary"
    | "aran.throw"
    | "aran.createObject"
    | "aran.get"
    | "aran.set"
    | "aran.delete"
    | "aran.deadzone"
    | "aran.AranError"
    | "aran.asynchronousGeneratorPrototype"
    | "aran.generatorPrototype"
    // Grabbable //
    | "globalThis"
    | "Object" // Convertion inside destructuring pattern + super
    | "Reflect.defineProperty" // Proxy Arguments trap :(
    | "eval"
    | "Symbol"
    | "Symbol.unscopables"
    | "Symbol.asyncIterator"
    | "Symbol.iterator"
    | "Symbol.isConcatSpreadable"
    | "Function.prototype.arguments@get"
    | "Function.prototype.arguments@set"
    | "Array.prototype.values"
    | "Object.prototype"
    // Convertion //
    | "String"
    // Object
    | "Array.from"
    | "Array.prototype.flat"
    // Construction //
    | "Object.create"
    | "Array.of"
    | "Proxy"
    | "RegExp"
    | "TypeError"
    | "ReferenceError"
    | "SyntaxError"
    // Readers //
    | "Reflect.get"
    | "Reflect.has"
    | "Reflect.construct"
    | "Reflect.apply"
    | "Reflect.setProtoypeOf"
    | "Reflect.getPrototypeOf"
    | "Reflect.ownKeys"
    | "Reflect.isExtensible"
    | "Object.keys"
    | "Array.prototype.concat"
    | "Array.prototype.includes"
    | "Array.prototype.slice"
    // Writers //
    | "Reflect.set"
    | "Reflect.deleteProperty"
    | "Reflect.setPrototypeOf"
    // "Reflect.defineProperty",
    | "Reflect.getOwnPropertyDescriptor"
    | "Reflect.preventExtensions"
    | "Object.assign"
    | "Object.freeze"
    | "Object.defineProperty"
    | "Object.setPrototypeOf"
    | "Object.preventExtensions"
    | "Array.prototype.fill"
    | "Array.prototype.push";

  type Parameter =
    | "this"
    | "import"
    | "catch.error"
    | "function.arguments" // https://github.com/allenwb/ESideas/blob/HEAD/ES7MetaProps.md
    | "import.meta"
    | "new.target"
    | "super.get"
    | "super.set"
    | "super.call";

  type Program<A extends Atom> =
    | {
        type: "ScriptProgram";
        body: PseudoBlock<A>;
        tag: A["Tag"];
      }
    | {
        type: "ModuleProgram";
        links: Link<A>[];
        body: ClosureBlock<A>;
        tag: A["Tag"];
      }
    | {
        type: "EvalProgram";
        body: ClosureBlock<A>;
        tag: A["Tag"];
      };

  type Link<A extends Atom> =
    | {
        type: "ImportLink";
        source: A["Source"];
        import: A["Specifier"] | null;
        tag: A["Tag"];
      }
    | { type: "ExportLink"; export: A["Specifier"]; tag: A["Tag"] }
    | {
        type: "AggregateLink";
        source: A["Source"];
        import: A["Specifier"] | null;
        export: A["Specifier"] | null;
        tag: A["Tag"];
      };

  type ClosureBlock<A extends Atom> = {
    type: "ClosureBlock";
    variables: A["Variable"][];
    statements: Statement<A>[];
    completion: Expression<A>;
    tag: A["Tag"];
  };

  type ControlBlock<A extends Atom> = {
    type: "ControlBlock";
    labels: A["Label"][];
    variables: A["Variable"][];
    statements: Statement<A>[];
    tag: A["Tag"];
  };

  type PseudoBlock<A extends Atom> = {
    type: "PseudoBlock";
    statements: Statement<A>[];
    completion: Expression<A>;
    tag: A["Tag"];
  };

  type Statement<A extends Atom> =
    | { type: "EffectStatement"; inner: Effect<A>; tag: A["Tag"] }
    | { type: "ReturnStatement"; result: Expression<A>; tag: A["Tag"] }
    | { type: "BreakStatement"; label: A["Label"]; tag: A["Tag"] }
    | { type: "DebuggerStatement"; tag: A["Tag"] }
    | {
        type: "DeclareEnclaveStatement";
        kind: VariableKind;
        variable: A["EnclaveVariable"];
        right: Expression<A>;
        tag: A["Tag"];
      }
    | { type: "BlockStatement"; do: ControlBlock<A>; tag: A["Tag"] }
    | {
        type: "IfStatement";
        if: Expression<A>;
        then: ControlBlock<A>;
        else: ControlBlock<A>;
        tag: A["Tag"];
      }
    | {
        type: "WhileStatement";
        while: Expression<A>;
        do: ControlBlock<A>;
        tag: A["Tag"];
      }
    | {
        type: "TryStatement";
        try: ControlBlock<A>;
        catch: ControlBlock<A>;
        finally: ControlBlock<A>;
        tag: A["Tag"];
      };

  type Effect<A extends Atom> =
    | { type: "ExpressionEffect"; discard: Expression<A>; tag: A["Tag"] }
    | {
        type: "ConditionalEffect";
        condition: Expression<A>;
        positive: Effect<A>[];
        negative: Effect<A>[];
        tag: A["Tag"];
      }
    | {
        type: "WriteEffect";
        variable: Parameter | A["Variable"];
        right: Expression<A>;
        tag: A["Tag"];
      }
    | {
        type: "WriteEnclaveEffect";
        variable: A["EnclaveVariable"];
        right: Expression<A>;
        tag: A["Tag"];
      }
    | {
        type: "ExportEffect";
        export: A["Specifier"];
        right: Expression<A>;
        tag: A["Tag"];
      };

  type Expression<A extends Atom> =
    // Produce //
    | { type: "PrimitiveExpression"; primitive: aran.Primitive; tag: A["Tag"] }
    | { type: "IntrinsicExpression"; intrinsic: Intrinsic; tag: A["Tag"] }
    | {
        type: "ImportExpression";
        source: A["Source"];
        import: A["Specifier"] | null;
        tag: A["Tag"];
      }
    | {
        type: "ReadExpression";
        variable: Parameter | A["Variable"];
        tag: A["Tag"];
      }
    | {
        type: "ReadEnclaveExpression";
        variable: A["EnclaveVariable"];
        tag: A["Tag"];
      }
    | {
        type: "TypeofEnclaveExpression";
        variable: A["EnclaveVariable"];
        tag: A["Tag"];
      }
    | {
        type: "ClosureExpression";
        kind: ClosureKind;
        asynchronous: boolean;
        generator: boolean;
        body: ClosureBlock<A>;
        tag: A["Tag"];
      }
    // Control //
    | { type: "AwaitExpression"; promise: Expression<A>; tag: A["Tag"] }
    | {
        type: "YieldExpression";
        delegate: boolean;
        item: Expression<A>;
        tag: A["Tag"];
      }
    | {
        type: "SequenceExpression";
        head: Effect<A>;
        tail: Expression<A>;
        tag: A["Tag"];
      }
    | {
        type: "ConditionalExpression";
        condition: Expression<A>;
        consequent: Expression<A>;
        alternate: Expression<A>;
        tag: A["Tag"];
      }
    // Combine //
    | {
        type: "EvalExpression";
        code: Expression<A>;
        tag: A["Tag"];
      }
    | {
        type: "ApplyExpression";
        callee: Expression<A>;
        this: Expression<A>;
        arguments: Expression<A>[];
        tag: A["Tag"];
      }
    | {
        type: "ConstructExpression";
        callee: Expression<A>;
        arguments: Expression<A>[];
        tag: A["Tag"];
      };

  type Node<A extends Atom> =
    | Program<A>
    | Link<A>
    | ControlBlock<A>
    | ClosureBlock<A>
    | PseudoBlock<A>
    | Statement<A>
    | Effect<A>
    | Expression<A>;
}
