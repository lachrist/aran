// declare module "prettier" {
//   type Foo = {
//     format(source: string, options: any): string;
//   };
//   export default Foo;
// }

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

type Mapper<C, T1, T2> = {
  block: (node: Block<T1>, context: C) => Block<T2>;
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
  | "error"
  | "arguments"
  | "this"
  | "import"
  | "import.meta"
  | "new.target"
  | "super.get"
  | "super.set"
  | "super.call";

type Link =
  | { type: "import"; source: string; import: string | null }
  | { type: "export"; export: string }
  | {
      type: "aggregate";
      source: string;
      import: string | null;
      export: string | null;
    };

// Expression => value | promise | item | callee | this | arguments
// Effect => first | inner
// Block => naked | then | else | try | catch | finally
// Statements[] => body
//
// ClosureKind => kind
// ProgramKind => kind
// VariableKind => kind
// Specifier => export | import
// Variable => variable
// Label => label
// Link[] => links

type ClosureBlock<T> = {
  type: "ClosureBlock";
  variables: string[];
  statements: Statement<T>[];
  completion: Expression<T>;
  tag: T;
};

type ControlBlock<T> = {
  type: "ControlBlock";
  labels: string[];
  variables: string[];
  statements: Statement<T>[];
  tag: T;
};

type PseudoBlock<T> = {
  type: "PseudoBlock";
  statements: Statement<T>[];
  completion: Expression<T>;
  tag: T;
};

type Program<T> =
  | {
      type: "ScriptProgram";
      body: PseudoBlock<T>;
      tag: T;
    }
  | {
      type: "ModuleProgram";
      links: Link[];
      body: ClosureBlock<T>;
      tag: T;
    }
  | {
      type: "EvalProgram";
      body: ClosureBlock<T>;
      tag: T;
    };

// type Program<T> =
//   | {
//       type: "Program";
//       kind: "eval";
//       links: [];
//       variables: string[];
//       body: Statement<T>[];
//       completion: Expression<T>;
//       tag: T;
//     }
//   | {
//       type: "Program";
//       kind: "module";
//       links: Link[];
//       variables: string[];
//       body: Statement<T>[];
//       completion: Expression<T>;
//       tag: T;
//     }
//   | {
//       type: "Program";
//       kind: "script";
//       links: [];
//       variables: [];
//       body: Statement<T>[];
//       completion: Expression<T>;
//       tag: T;
//     };

type Statement<T> =
  | { type: "EffectStatement"; inner: Effect<T>; tag: T }
  | { type: "ReturnStatement"; result: Expression<T>; tag: T }
  | { type: "BreakStatement"; label: string; tag: T }
  | { type: "DebuggerStatement"; tag: T }
  | {
      type: "DeclareEnclaveStatement";
      kind: VariableKind;
      variable: string;
      value: Expression<T>;
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
  // | {
  //     type: "ConditionalEffect";
  //     test: Expression<T>;
  //     positive: Effect<T>[];
  //     negative: Effect<T>[];
  //     tag: T;
  //   }
  | {
      type: "WriteEffect";
      variable: string;
      right: Expression<T>;
      tag: T;
    }
  | {
      type: "WriteEnclaveEffect";
      variable: string;
      right: Expression<T>;
      tag: T;
    }
  | {
      type: "ExportEffect";
      export: string;
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
      source: string;
      import: string | null;
      tag: T;
    }
  | { type: "ReadExpression"; variable: string; tag: T }
  | { type: "ReadEnclaveExpression"; variable: string; tag: T }
  | { type: "TypeofEnclaveExpression"; variable: string; tag: T }
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

type Node<T> = Program<T> | Block<T> | Statement<T> | Effect<T> | Expression<T>;
