// declare module "prettier" {
//   type Foo = {
//     format(source: string, options: any): string;
//   };
//   export default Foo;
// }

// Estree //

type EstreeAssignmentProperty = import("estree").AssignmentProperty;
type EstreeRestElement = import("estree").RestElement;
type EstreeUnionImportSpecifier =
  | import("estree").ImportSpecifier
  | import("estree").ImportDefaultSpecifier
  | import("estree").ImportNamespaceSpecifier;
type EstreeObjec = import("estree").Object;
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

// Aran //

type Source = string;
type Specifier = string;
type Variable = string;
type Label = string;

type Primitive = undefined | null | boolean | number | bigint | string;

type PackPrimitive =
  | { undefined: null }
  | null
  | boolean
  | number
  | { bigint: string }
  | string;

type DeclareKind = "var" | "let" | "const";

type ClosureKind = "arrow" | "function" | "method" | "constructor";

type Intrinsic =
  // Ad hoc //
  | "aran.globalCache"
  | "aran.globalRecord"
  | "aran.globalObject"
  | "aran.unary"
  | "aran.binary"
  | "aran.throw"
  | "aran.createObject"
  | "aran.get"
  | "aran.setStrict"
  | "aran.setSloppy"
  | "aran.deleteStrict"
  | "aran.deleteSloppy"
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
  | { type: "ScriptProgram"; statements: Statement<T>[]; tag: T }
  | { type: "ModuleProgram"; links: Link<T>[]; body: Block<T>; tag: T }
  | { type: "EvalProgram"; body: Block<T>; tag: T };

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

type Block<T> = {
  type: "Block";
  labels: Label[];
  variables: Variable[];
  statements: Statement<T>[];
  tag: T;
};

type Statement<T> =
  | { type: "EffectStatement"; effect: Effect<T>; tag: T }
  | { type: "ReturnStatement"; value: Expression<T>; tag: T }
  | { type: "BreakStatement"; label: Label; tag: T }
  | { type: "DebuggerStatement"; tag: T }
  | {
      type: "DeclareExternalStatement";
      kind: DeclareKind;
      variable: string;
      value: Expression<T>;
      tag: T;
    }
  | { type: "BlockStatement"; body: Block<T>; tag: T }
  | {
      type: "IfStatement";
      test: Expression<T>;
      then: Block<T>;
      else: Block<T>;
      tag: T;
    }
  | { type: "WhileStatement"; test: Expression<T>; body: Block<T>; tag: T }
  | {
      type: "TryStatement";
      body: Block<T>;
      catch: Block<T>;
      finally: Block<T>;
      tag: T;
    };

type Effect<T> =
  | { type: "ExpressionEffect"; discard: Expression<T>; tag: T }
  | {
      type: "ConditionalEffect";
      test: Expression<T>;
      positive: Effect<T>[];
      negative: Effect<T>[];
      tag: T;
    }
  | {
      type: "WriteEffect";
      variable: Variable;
      value: Expression<T>;
      tag: T;
    }
  | {
      type: "WriteExternalEffect";
      variable: Variable;
      value: Expression<T>;
      tag: T;
    }
  | {
      type: "ExportEffect";
      export: Specifier;
      value: Expression<T>;
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
  | { type: "ReadExternalExpression"; variable: Variable; tag: T }
  | { type: "TypeofExternalExpression"; variable: Variable; tag: T }
  | {
      type: "ClosureExpression";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      body: Block<T>;
      tag: T;
    }
  // Control //
  | { type: "AwaitExpression"; value: Expression<T>; tag: T }
  | {
      type: "YieldExpression";
      delegate: boolean;
      value: Expression<T>;
      tag: T;
    }
  | {
      type: "SequenceExpression";
      effect: Effect<T>;
      value: Expression<T>;
      tag: T;
    }
  | {
      type: "ConditionalExpression";
      test: Expression<T>;
      consequent: Expression<T>;
      alternate: Expression<T>;
      tag: T;
    }
  // Combine //
  | {
      type: "EvalExpression";
      argument: Expression<T>;
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
