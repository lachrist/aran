declare namespace aran {
  type Label = Brand<string, "aran.Label">;

  type Variable = Brand<string, "aran.Variable">;

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

  type Program<V, T> =
    | {
        type: "ScriptProgram";
        body: PseudoBlock<V, T>;
        tag: T;
      }
    | {
        type: "ModuleProgram";
        links: Link<T>[];
        body: ClosureBlock<V, T>;
        tag: T;
      }
    | {
        type: "EvalProgram";
        body: ClosureBlock<V, T>;
        tag: T;
      };

  type Link<T> =
    | {
        type: "ImportLink";
        source: estree.Source;
        import: estree.Specifier | null;
        tag: T;
      }
    | { type: "ExportLink"; export: estree.Specifier; tag: T }
    | {
        type: "AggregateLink";
        source: estree.Source;
        import: estree.Specifier | null;
        export: estree.Specifier | null;
        tag: T;
      };

  type ClosureBlock<V, T> = {
    type: "ClosureBlock";
    variables: V[];
    statements: Statement<V, T>[];
    completion: Expression<V, T>;
    tag: T;
  };

  type ControlBlock<V, T> = {
    type: "ControlBlock";
    labels: Label[];
    variables: V[];
    statements: Statement<V, T>[];
    tag: T;
  };

  type PseudoBlock<V, T> = {
    type: "PseudoBlock";
    statements: Statement<V, T>[];
    completion: Expression<V, T>;
    tag: T;
  };

  type Statement<V, T> =
    | { type: "EffectStatement"; inner: Effect<V, T>; tag: T }
    | { type: "ReturnStatement"; result: Expression<V, T>; tag: T }
    | { type: "BreakStatement"; label: Label; tag: T }
    | { type: "DebuggerStatement"; tag: T }
    | {
        type: "DeclareEnclaveStatement";
        kind: VariableKind;
        variable: estree.Variable;
        right: Expression<V, T>;
        tag: T;
      }
    | { type: "BlockStatement"; do: ControlBlock<V, T>; tag: T }
    | {
        type: "IfStatement";
        if: Expression<V, T>;
        then: ControlBlock<V, T>;
        else: ControlBlock<V, T>;
        tag: T;
      }
    | {
        type: "WhileStatement";
        while: Expression<V, T>;
        do: ControlBlock<V, T>;
        tag: T;
      }
    | {
        type: "TryStatement";
        try: ControlBlock<V, T>;
        catch: ControlBlock<V, T>;
        finally: ControlBlock<V, T>;
        tag: T;
      };

  type Effect<V, T> =
    | { type: "ExpressionEffect"; discard: Expression<V, T>; tag: T }
    | {
        type: "ConditionalEffect";
        condition: Expression<V, T>;
        positive: Effect<V, T>[];
        negative: Effect<V, T>[];
        tag: T;
      }
    | {
        type: "WriteEffect";
        variable: Parameter | V;
        right: Expression<V, T>;
        tag: T;
      }
    | {
        type: "WriteEnclaveEffect";
        variable: estree.Variable;
        right: Expression<V, T>;
        tag: T;
      }
    | {
        type: "ExportEffect";
        export: estree.Specifier;
        right: Expression<V, T>;
        tag: T;
      };

  type Expression<V, T> =
    // Produce //
    | { type: "PrimitiveExpression"; primitive: aran.Primitive; tag: T }
    | { type: "IntrinsicExpression"; intrinsic: Intrinsic; tag: T }
    | {
        type: "ImportExpression";
        source: estree.Source;
        import: estree.Specifier | null;
        tag: T;
      }
    | { type: "ReadExpression"; variable: Parameter | V; tag: T }
    | { type: "ReadEnclaveExpression"; variable: estree.Variable; tag: T }
    | { type: "TypeofEnclaveExpression"; variable: estree.Variable; tag: T }
    | {
        type: "ClosureExpression";
        kind: ClosureKind;
        asynchronous: boolean;
        generator: boolean;
        body: ClosureBlock<V, T>;
        tag: T;
      }
    // Control //
    | { type: "AwaitExpression"; promise: Expression<V, T>; tag: T }
    | {
        type: "YieldExpression";
        delegate: boolean;
        item: Expression<V, T>;
        tag: T;
      }
    | {
        type: "SequenceExpression";
        head: Effect<V, T>;
        tail: Expression<V, T>;
        tag: T;
      }
    | {
        type: "ConditionalExpression";
        condition: Expression<V, T>;
        consequent: Expression<V, T>;
        alternate: Expression<V, T>;
        tag: T;
      }
    // Combine //
    | {
        type: "EvalExpression";
        code: Expression<V, T>;
        tag: T;
      }
    | {
        type: "ApplyExpression";
        callee: Expression<V, T>;
        this: Expression<V, T>;
        arguments: Expression<V, T>[];
        tag: T;
      }
    | {
        type: "ConstructExpression";
        callee: Expression<V, T>;
        arguments: Expression<V, T>[];
        tag: T;
      };

  type Node<V, T> =
    | Program<V, T>
    | Link<T>
    | ControlBlock<V, T>
    | ClosureBlock<V, T>
    | PseudoBlock<V, T>
    | Statement<V, T>
    | Effect<V, T>
    | Expression<V, T>;
}
