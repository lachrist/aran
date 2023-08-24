// declare module "prettier" {
//   type Foo = {
//     format(source: string, options: any): string;
//   };
//   export default Foo;
// }

// General //

type Context = {
  enclave: boolean;
};

// internal-script
// external-script
//   - declare
//   - intrinsics.readGlobal
//   - intrinsics.writeGlobal
//   - intrinsics.typeofGlobal
// internal-module
// external-module
//   - intrinsics.readGlobal
//   - intrinsics.writeGlobal
//   - intrinsics.typeofGlobal
// internal-global-eval
// external-global-eval
//   - intrinsics.readGlobal
//   - intrinsics.writeGlobal
//   - intrinsics.typeofGlobal
// internal-local-eval
// external-local-eval
//   - params.scope.read
//   - params.scope.write
//   - params.scope.typeof

// const ProgramType = {
//   type: "script";
//   enclave: boolean; -> Declare
// } | {
//   type: "module";
//   enclave: boolean;
// } | {
//   type: "internal-global-eval";
//   enclave: boolean;
//   ->
// } | {
//   type: "external-local-eval";
//   super.get: boolean;
//   super.set: boolean;
//   super.call: boolean;
//   -> params.scope.read + params.scope.write + params.scope.typeof
// } | {
//   type: "internal-local-eval";
//   scope: Scope;
// };

type List<X> = { car: X; cdr: List<X> } | null;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

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

type Mapper = {
  link: (node: Link) => Link;
  block: (node: Block) => Block;
  statement: (nodes: Statement) => Statement;
  effect: (nodes: Effect) => Effect;
  expression: (node: Expression) => Expression;
};

type VariableKind = "var" | "let" | "const";

type ClosureKind = "arrow" | "function" | "method" | "constructor";

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
  | "error"
  | "arguments"
  | "this"
  | "import"
  | "callee"
  | "import.meta"
  | "new.target"
  | "super.get"
  | "super.set"
  | "super.call";

type Program =
  | { type: "ScriptProgram"; statements: Statement[]; tag?: unknown }
  | { type: "ModuleProgram"; links: Link[]; body: Block; tag?: unknown }
  | { type: "EvalProgram"; body: Block; tag?: unknown };

type Link =
  | { type: "ImportLink"; source: string; import: string | null; tag?: unknown }
  | { type: "ExportLink"; export: string; tag?: unknown }
  | {
      type: "AggregateLink";
      source: string;
      import: string | null;
      export: string | null;
      tag?: unknown;
    };

type Block = {
  type: "Block";
  labels: string[];
  variables: string[];
  statements: Statement[];
  tag?: unknown;
};

type Statement =
  | { type: "EffectStatement"; effect: Effect; tag?: unknown }
  | { type: "ReturnStatement"; value: Expression; tag?: unknown }
  | { type: "BreakStatement"; label: string; tag?: unknown }
  | { type: "DebuggerStatement"; tag?: unknown }
  | {
      type: "DeclareEnclaveStatement";
      kind: VariableKind;
      variable: string;
      value: Expression;
      tag?: unknown;
    }
  | { type: "BlockStatement"; body: Block; tag?: unknown }
  | {
      type: "IfStatement";
      test: Expression;
      then: Block;
      else: Block;
      tag?: unknown;
    }
  | { type: "WhileStatement"; test: Expression; body: Block; tag?: unknown }
  | {
      type: "TryStatement";
      body: Block;
      catch: Block;
      finally: Block;
      tag?: unknown;
    };

type Effect =
  | { type: "ExpressionEffect"; discard: Expression; tag?: unknown }
  // | {
  //     type: "ConditionalEffect";
  //     test: Expression;
  //     positive: Effect[];
  //     negative: Effect[];
  //     tag?: unknown;
  //   }
  | {
      type: "WriteEffect";
      variable: string;
      value: Expression;
      tag?: unknown;
    }
  | {
      type: "WriteEnclaveEffect";
      variable: string;
      value: Expression;
      tag?: unknown;
    }
  | {
      type: "ExportEffect";
      export: string;
      value: Expression;
      tag?: unknown;
    };

type Expression =
  // Produce //
  | { type: "ParameterExpression"; parameter: Parameter; tag?: unknown }
  | { type: "PrimitiveExpression"; primitive: PackPrimitive; tag?: unknown }
  | { type: "IntrinsicExpression"; intrinsic: Intrinsic; tag?: unknown }
  | {
      type: "ImportExpression";
      source: string;
      import: string | null;
      tag?: unknown;
    }
  | { type: "ReadExpression"; variable: string; tag?: unknown }
  | { type: "ReadEnclaveExpression"; variable: string; tag?: unknown }
  | { type: "TypeofEnclaveExpression"; variable: string; tag?: unknown }
  | {
      type: "ClosureExpression";
      kind: ClosureKind;
      asynchronous: boolean;
      generator: boolean;
      body: Block;
      tag?: unknown;
    }
  // Control //
  | { type: "AwaitExpression"; value: Expression; tag?: unknown }
  | {
      type: "YieldExpression";
      delegate: boolean;
      value: Expression;
      tag?: unknown;
    }
  | {
      type: "SequenceExpression";
      effect: Effect;
      value: Expression;
      tag?: unknown;
    }
  | {
      type: "ConditionalExpression";
      test: Expression;
      consequent: Expression;
      alternate: Expression;
      tag?: unknown;
    }
  // Combine //
  | {
      type: "EvalExpression";
      argument: Expression;
      tag?: unknown;
    }
  | {
      type: "ApplyExpression";
      callee: Expression;
      this: Expression;
      arguments: Expression[];
      tag?: unknown;
    }
  | {
      type: "ConstructExpression";
      callee: Expression;
      arguments: Expression[];
      tag?: unknown;
    };

type Node = Program | Link | Block | Statement | Effect | Expression;
