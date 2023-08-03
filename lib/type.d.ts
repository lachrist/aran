// declare module "prettier" {
//   type Foo = {
//     format(source: string, options: any): string;
//   };
//   export default Foo;
// }

// General //

type List<X> = { car: X; cdr: List<X> } | null;

// Estree //

type EstreeIdentifier = import("estree").Identifier;
type EstreeSwitchCase = import("estree").SwitchCase;
type EstreeUnaryOperator = import("estree").UnaryOperator;
type EstreeBinaryOperator = import("estree").BinaryOperator;
type EstreeExportSpecifier = import("estree").ExportSpecifier;
type EstreeAssignmentProperty = import("estree").AssignmentProperty;
type EstreeRestElement = import("estree").RestElement;
type EstreeUnionImportSpecifier =
  | import("estree").ImportSpecifier
  | import("estree").ImportDefaultSpecifier
  | import("estree").ImportNamespaceSpecifier;
type EstreeFunction = import("estree").Function;
type EstreeBigIntLiteral = import("estree").BigIntLiteral;
type EstreeSimpleLiteral = import("estree").SimpleLiteral;
type EstreeSourceLocation = import("estree").SourceLocation;
type EstreeVariableDeclaration = import("estree").VariableDeclaration;
type EstreeStatement = import("estree").Statement;
type EstreeExpression = import("estree").Expression;
type EstreeProgram = import("estree").Program;
type EstreeNode = import("estree").Node;
type EstreeLiteral = import("estree").Literal;
type EstreePattern = import("estree").Pattern;
type EstreeVariableDeclarator = import("estree").VariableDeclarator;
type EstreeModuleDeclaration = import("estree").ModuleDeclaration;
type EstreeBlockStatement = import("estree").BlockStatement;
type EstreeDirective = import("estree").Directive;
type EstreeProgramStatement =
  | EstreeModuleDeclaration
  | EstreeStatement
  | EstreeDirective;

// Aran Syntax //

type Primitive = undefined | null | boolean | number | bigint | string;

type PackPrimitive =
  | { undefined: null }
  | null
  | boolean
  | number
  | { bigint: string }
  | string;

type Mapper<T> = {
  link: (node: Link<T>) => Link<T>;
  block: (node: Block<T>) => Block<T>;
  statement: (nodes: Statement<T>) => Statement<T>;
  effect: (nodes: Effect<T>) => Effect<T>;
  expression: (node: Expression<T>) => Expression<T>;
};

type VariableKind = "var" | "let" | "const";

type ClosureKind = "arrow" | "function" | "method" | "constructor";

type Intrinsic =
  // Ad hoc //
  | "aran.global.record.variables"
  | "aran.global.record.values"
  | "aran.global.object"
  | "aran.global.cache"
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
  | "error"
  | "arguments"
  | "this"
  | "import"
  | "import.meta"
  | "new.target"
  | "super.get"
  | "super.set"
  | "super.call";

type Program<T> =
  | { type: "ScriptProgram"; statements: Statement<T>[]; tag?: T }
  | { type: "ModuleProgram"; links: Link<T>[]; body: Block<T>; tag?: T }
  | { type: "EvalProgram"; body: Block<T>; tag?: T };

type Link<T> =
  | { type: "ImportLink"; source: string; import: string | null; tag?: T }
  | { type: "ExportLink"; export: string; tag?: T }
  | {
      type: "AggregateLink";
      source: string;
      import: string | null;
      export: string | null;
      tag?: T;
    };

type Block<T> = {
  type: "Block";
  labels: string[];
  variables: string[];
  statements: Statement<T>[];
  tag?: T;
};

type Statement<T> =
  | { type: "EffectStatement"; effect: Effect<T>; tag?: T }
  | { type: "ReturnStatement"; value: Expression<T>; tag?: T }
  | { type: "BreakStatement"; label: string; tag?: T }
  | { type: "DebuggerStatement"; tag?: T }
  | {
      type: "DeclareExternalStatement";
      kind: VariableKind;
      variable: string;
      value: Expression<T>;
      tag?: T;
    }
  | { type: "BlockStatement"; body: Block<T>; tag?: T }
  | {
      type: "IfStatement";
      test: Expression<T>;
      then: Block<T>;
      else: Block<T>;
      tag?: T;
    }
  | { type: "WhileStatement"; test: Expression<T>; body: Block<T>; tag?: T }
  | {
      type: "TryStatement";
      body: Block<T>;
      catch: Block<T>;
      finally: Block<T>;
      tag?: T;
    };

type Effect<T> =
  | { type: "ExpressionEffect"; discard: Expression<T>; tag?: T }
  | {
      type: "ConditionalEffect";
      test: Expression<T>;
      positive: Effect<T>[];
      negative: Effect<T>[];
      tag?: T;
    }
  | {
      type: "WriteEffect";
      variable: string;
      value: Expression<T>;
      tag?: T;
    }
  | {
      type: "WriteExternalEffect";
      variable: string;
      value: Expression<T>;
      tag?: T;
    }
  | {
      type: "ExportEffect";
      export: string;
      value: Expression<T>;
      tag?: T;
    };

type Expression<T> =
  // Produce //
  | { type: "ParameterExpression"; parameter: Parameter; tag?: T }
  | { type: "PrimitiveExpression"; primitive: PackPrimitive; tag?: T }
  | { type: "IntrinsicExpression"; intrinsic: Intrinsic; tag?: T }
  | {
      type: "ImportExpression";
      source: string;
      import: string | null;
      tag?: T;
    }
  | { type: "ReadExpression"; variable: string; tag?: T }
  | { type: "ReadExternalExpression"; variable: string; tag?: T }
  | { type: "TypeofExternalExpression"; variable: string; tag?: T }
  | {
      type: "ClosureExpression";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      body: Block<T>;
      tag?: T;
    }
  // Control //
  | { type: "AwaitExpression"; value: Expression<T>; tag?: T }
  | {
      type: "YieldExpression";
      delegate: boolean;
      value: Expression<T>;
      tag?: T;
    }
  | {
      type: "SequenceExpression";
      effect: Effect<T>;
      value: Expression<T>;
      tag?: T;
    }
  | {
      type: "ConditionalExpression";
      test: Expression<T>;
      consequent: Expression<T>;
      alternate: Expression<T>;
      tag?: T;
    }
  // Combine //
  | {
      type: "EvalExpression";
      argument: Expression<T>;
      tag?: T;
    }
  | {
      type: "ApplyExpression";
      callee: Expression<T>;
      this: Expression<T>;
      arguments: Expression<T>[];
      tag?: T;
    }
  | {
      type: "ConstructExpression";
      callee: Expression<T>;
      arguments: Expression<T>[];
      tag?: T;
    };

type Node<T> =
  | Program<T>
  | Link<T>
  | Block<T>
  | Statement<T>
  | Effect<T>
  | Expression<T>;
