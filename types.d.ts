declare const __brand: unique symbol;

type Brand<T, B> = T & { [__brand]: B };

type List<X> = { car: X; cdr: List<X> } | null;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

// Estree //

declare namespace estree {
  type Identifier = import("estree").Identifier;
  type SwitchCase = import("estree").SwitchCase;
  type UnaryOperator = import("estree").UnaryOperator;
  type BinaryOperator = import("estree").BinaryOperator;
  type ExportSpecifier = import("estree").ExportSpecifier;
  type AssignmentProperty = import("estree").AssignmentProperty;
  type RestElement = import("estree").RestElement;
  type UnionImportSpecifier =
    | import("estree").ImportSpecifier
    | import("estree").ImportDefaultSpecifier
    | import("estree").ImportNamespaceSpecifier;
  type Function = import("estree").Function;
  type BigIntLiteral = import("estree").BigIntLiteral;
  type SimpleLiteral = import("estree").SimpleLiteral;
  type SourceLocation = import("estree").SourceLocation;
  type VariableDeclaration = import("estree").VariableDeclaration;
  type Statement = import("estree").Statement;
  type Expression = import("estree").Expression;
  type Program = import("estree").Program;
  type Node = import("estree").Node;
  type Literal = import("estree").Literal;
  type Pattern = import("estree").Pattern;
  type VariableDeclarator = import("estree").VariableDeclarator;
  type ModuleDeclaration = import("estree").ModuleDeclaration;
  type BlockStatement = import("estree").BlockStatement;
  type Directive = import("estree").Directive;
  type Property = import("estree").Property;
  type ProgramStatement = ModuleDeclaration | Statement | Directive;
}

// Aran Syntax //

type Variable = Brand<string, "Variable">;
type Label = Brand<string, "Label">;
type Specifier = Brand<string, "Specifier">;
type Source = Brand<string, "Source">;

type Primitive = undefined | null | boolean | number | bigint | string;

type PackPrimitive =
  | { undefined: null }
  | null
  | boolean
  | number
  | { bigint: string }
  | string;

type Mapper<C, T1, T2> = {
  control: (node: ControlBlock<T1>, context: C) => ControlBlock<T2>;
  closure: (node: ClosureBlock<T1>, context: C) => ClosureBlock<T2>;
  pseudo: (node: PseudoBlock<T1>, context: C) => PseudoBlock<T2>;
  statement: (nodes: Statement<T1>, context: C) => Statement<T2>;
  effect: (nodes: Effect<T1>, context: C) => Effect<T2>;
  expression: (node: Expression<T1>, context: C) => Expression<T2>;
};

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

type Program<T> =
  | {
      type: "ScriptProgram";
      body: PseudoBlock<T>;
      tag: T;
    }
  | {
      type: "ModuleProgram";
      links: Link<T>[];
      body: ClosureBlock<T>;
      tag: T;
    }
  | {
      type: "EvalProgram";
      body: ClosureBlock<T>;
      tag: T;
    };

type Link<T> =
  | { type: "ImportLink"; source: Source; import: Specifier | null; tag: T }
  | { type: "ExportLink"; export: Specifier; tag: T }
  | {
      type: "AggregateLink";
      source: Source;
      import: Specifier | null;
      export: Specifier | null;
      tag: T;
    };

type ClosureBlock<T> = {
  type: "ClosureBlock";
  variables: Variable[];
  statements: Statement<T>[];
  completion: Expression<T>;
  tag: T;
};

type ControlBlock<T> = {
  type: "ControlBlock";
  labels: Label[];
  variables: Variable[];
  statements: Statement<T>[];
  tag: T;
};

type PseudoBlock<T> = {
  type: "PseudoBlock";
  statements: Statement<T>[];
  completion: Expression<T>;
  tag: T;
};

type Statement<T> =
  | { type: "EffectStatement"; inner: Effect<T>; tag: T }
  | { type: "ReturnStatement"; result: Expression<T>; tag: T }
  | { type: "BreakStatement"; label: Label; tag: T }
  | { type: "DebuggerStatement"; tag: T }
  | {
      type: "DeclareEnclaveStatement";
      kind: VariableKind;
      variable: Variable;
      right: Expression<T>;
      tag: T;
    }
  | { type: "BlockStatement"; do: ControlBlock<T>; tag: T }
  | {
      type: "IfStatement";
      if: Expression<T>;
      then: ControlBlock<T>;
      else: ControlBlock<T>;
      tag: T;
    }
  | {
      type: "WhileStatement";
      while: Expression<T>;
      do: ControlBlock<T>;
      tag: T;
    }
  | {
      type: "TryStatement";
      try: ControlBlock<T>;
      catch: ControlBlock<T>;
      finally: ControlBlock<T>;
      tag: T;
    };

type Effect<T> =
  | { type: "ExpressionEffect"; discard: Expression<T>; tag: T }
  | {
      type: "ConditionalEffect";
      condition: Expression<T>;
      positive: Effect<T>[];
      negative: Effect<T>[];
      tag: T;
    }
  | {
      type: "WriteEffect";
      variable: Variable;
      right: Expression<T>;
      tag: T;
    }
  | {
      type: "WriteEnclaveEffect";
      variable: Variable;
      right: Expression<T>;
      tag: T;
    }
  | {
      type: "ExportEffect";
      export: Specifier;
      right: Expression<T>;
      tag: T;
    };

type Expression<T> =
  // Produce //
  | { type: "ParameterExpression"; parameter: Parameter; tag: T }
  | { type: "PrimitiveExpression"; primitive: PackPrimitive; tag: T }
  | { type: "IntrinsicExpression"; intrinsic: Intrinsic; tag: T }
  | {
      type: "ImportExpression";
      source: Source;
      import: Specifier | null;
      tag: T;
    }
  | { type: "ReadExpression"; variable: Variable; tag: T }
  | { type: "ReadEnclaveExpression"; variable: Variable; tag: T }
  | { type: "TypeofEnclaveExpression"; variable: Variable; tag: T }
  | {
      type: "ClosureExpression";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      body: ClosureBlock<T>;
      tag: T;
    }
  // Control //
  | { type: "AwaitExpression"; promise: Expression<T>; tag: T }
  | {
      type: "YieldExpression";
      delegate: boolean;
      item: Expression<T>;
      tag: T;
    }
  | {
      type: "SequenceExpression";
      head: Effect<T>;
      tail: Expression<T>;
      tag: T;
    }
  | {
      type: "ConditionalExpression";
      condition: Expression<T>;
      consequent: Expression<T>;
      alternate: Expression<T>;
      tag: T;
    }
  // Combine //
  | {
      type: "EvalExpression";
      code: Expression<T>;
      tag: T;
    }
  | {
      type: "ApplyExpression";
      callee: Expression<T>;
      this: Expression<T>;
      arguments: Expression<T>[];
      tag: T;
    }
  | {
      type: "ConstructExpression";
      callee: Expression<T>;
      arguments: Expression<T>[];
      tag: T;
    };

type Node<T> =
  | Program<T>
  | Link<T>
  | ControlBlock<T>
  | ClosureBlock<T>
  | PseudoBlock<T>
  | Statement<T>
  | Effect<T>
  | Expression<T>;
