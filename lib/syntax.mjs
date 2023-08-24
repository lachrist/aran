import { hasOwn } from "./util/index.mjs";

const { Error, BigInt, String, undefined } = globalThis;

/** @type {(primitive: Primitive) => PackPrimitive} */
export const packPrimitive = (primitive) => {
  if (primitive === undefined) {
    return { undefined: null };
  } else if (typeof primitive === "bigint") {
    return { bigint: String(primitive) };
  } else {
    return primitive;
  }
};

/** @type {(primitive: PackPrimitive) => Primitive} */
export const unpackPrimitive = (primitive) => {
  if (typeof primitive === "object" && primitive !== null) {
    if (hasOwn(primitive, "undefined")) {
      return undefined;
    } else if (hasOwn(primitive, "bigint")) {
      return BigInt(primitive.bigint);
    } else {
      throw new Error("invalid primitive");
    }
  } else {
    return primitive;
  }
};

/** @type {<N extends Node>(node: N, tag: Json) => N} */
export const tagNode = (node, tag) => ({
  ...node,
  tag,
});

/** @type {Parameter[]} */
export const PARAMETER_ENUM = [
  "this",
  "new.target",
  "import",
  "arguments",
  "error",
  "import.meta",
  "super.call",
  "super.get",
  "super.set",
];

/** @type {Intrinsic[]} */
export const INTRINSIC_ENUM = [
  // Aran //
  "aran.cache",
  "aran.record.variables",
  "aran.record.values",
  "aran.global",
  "aran.unary",
  "aran.binary",
  "aran.throw",
  "aran.createObject",
  "aran.get",
  "aran.set",
  "aran.delete",
  "aran.deadzone",
  "aran.AranError",
  "aran.asynchronousGeneratorPrototype",
  "aran.generatorPrototype",
  // Grabbable //
  "globalThis",
  "Object", // Convertion inside destructuring pattern + super
  "Reflect.defineProperty", // Proxy Arguments trap :(
  "eval",
  "Symbol",
  "Symbol.unscopables",
  "Symbol.asyncIterator",
  "Symbol.iterator",
  "Symbol.isConcatSpreadable",
  "Function.prototype.arguments@get",
  "Function.prototype.arguments@set",
  "Array.prototype.values",
  "Object.prototype",
  // Convertion //
  "String",
  // Object
  "Array.from",
  "Array.prototype.flat",
  // Construction //
  "Object.create",
  "Array.of",
  "Proxy",
  "RegExp",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  // Readers //
  "Reflect.get",
  "Reflect.has",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.setProtoypeOf",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys",
  "Reflect.isExtensible",
  "Object.keys",
  "Array.prototype.concat",
  "Array.prototype.includes",
  "Array.prototype.slice",
  // Writers //
  "Reflect.set",
  "Reflect.deleteProperty",
  "Reflect.setPrototypeOf",
  // "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor",
  "Reflect.preventExtensions",
  "Object.assign",
  "Object.freeze",
  "Object.defineProperty",
  "Object.setPrototypeOf",
  "Object.preventExtensions",
  "Array.prototype.fill",
  "Array.prototype.push",
];

/////////////
// Program //
/////////////

/** @type {(statements: Statement[]) => Program} */
export const makeScriptProgram = (statements) => ({
  type: "ScriptProgram",
  statements,
});

/** @type {(links: Link[], body: Block) => Program} */
export const makeModuleProgram = (links, body) => ({
  type: "ModuleProgram",
  links,
  body,
});

/** @type {(body: Block) => Program} */
export const makeEvalProgram = (body) => ({
  type: "EvalProgram",
  body,
});

//////////
// Link //
//////////

/** @type {(source: string, import_: string | null) => Link} */
export const makeImportLink = (source, import_) => ({
  type: "ImportLink",
  source,
  import: import_,
});

/** @type {(export_: string) => Link} */
export const makeExportLink = (export_) => ({
  type: "ExportLink",
  export: export_,
});

/**
 * @type {(
 *   source: string,
 *   import_: string | null,
 *   export_: string | null,
 * ) => Link}
 */
export const makeAggregateLink = (source, import_, export_) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
});

///////////
// Block //
///////////

/**
 * @type {(
 *   labels: string[],
 *   variables: string[],
 *   statements: Statement[],
 * ) => Block}
 */
export const makeBlock = (labels, variables, statements) => ({
  type: "Block",
  labels,
  variables,
  statements,
});

///////////////
// Statement //
///////////////

/** @type {(expression: Effect) => Statement} */
export const makeEffectStatement = (effect) => ({
  type: "EffectStatement",
  effect,
});

/**
 * @type {(
 *   kind: VariableKind,
 *   variable: string,
 *   value: Expression,
 * ) => Statement}
 */
export const makeDeclareEnclaveStatement = (kind, variable, value) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  value,
});

/** @type {(expression: Expression) => Statement} */
export const makeReturnStatement = (value) => ({
  type: "ReturnStatement",
  value,
});

/** @type {() => Statement} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
});

/** @type {(label: string) => Statement} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
});

/** @type {(body: Block) => Statement} */
export const makeBlockStatement = (body) => ({
  type: "BlockStatement",
  body,
});

/**
 * @type {(
 *   test: Expression,
 *   then_: Block,
 *   else_: Block,
 * ) => Statement}
 */
export const makeIfStatement = (test, then_, else_) => ({
  type: "IfStatement",
  test,
  then: then_,
  else: else_,
});

/**
 * @type {(
 *   body: Block,
 *   catch_: Block,
 *   finally_: Block,
 * ) => Statement}
 */
export const makeTryStatement = (body, catch_, finally_) => ({
  type: "TryStatement",
  body,
  catch: catch_,
  finally: finally_,
});

/** @type {(test: Expression, body: Block) => Statement} */
export const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
});

////////////
// Effect //
////////////

/** @type {(discard: Expression) => Effect} */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
});

/** @type {(variable: string, value: Expression) => Effect} */
export const makeWriteEffect = (variable, value) => ({
  type: "WriteEffect",
  variable,
  value,
});

/** @type {(variable: string, value: Expression) => Effect} */
export const makeWriteEnclaveEffect = (variable, value) => ({
  type: "WriteEnclaveEffect",
  variable,
  value,
});

/**
 * @type {(
 *   export_: string,
 *   value: Expression,
 * ) => Effect}
 */
export const makeExportEffect = (export_, value) => ({
  type: "ExportEffect",
  export: export_,
  value,
});

// /**
//  * @type {(
//  *   test: Expression,
//  *   positive: Effect[],
//  *   negative: Effect[],
//  * ) => Effect}
//  */
// export const makeConditionalEffect = (test, positive, negative) => ({
//   type: "ConditionalEffect",
//   test,
//   positive,
//   negative,
// });

////////////////
// Expression //
////////////////

/** @type {(primitive: PackPrimitive) => Expression} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
});

/** @type {(parameter: Parameter) => Expression} */
export const makeParameterExpression = (parameter) => ({
  type: "ParameterExpression",
  parameter,
});

/**
 * @type {(
 *   source: string,
 *   import_: string | null,
 * ) => Expression}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
});

/** @type {(intrinsic: Intrinsic) => Expression} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
});

/** @type {(variable: string) => Expression} */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
});

/** @type {(variable: string) => Expression} */
export const makeReadEnclaveExpression = (variable) => ({
  type: "ReadEnclaveExpression",
  variable,
});

/** @type {(variable: string) => Expression} */
export const makeTypeofEnclaveExpression = (variable) => ({
  type: "TypeofEnclaveExpression",
  variable,
});

/**
 * @type {(
 *   kind: ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: Block,
 * ) => Expression}
 */
export const makeClosureExpression = (kind, asynchronous, generator, body) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
});

/** @type {(value: Expression) => Expression} */
export const makeAwaitExpression = (value) => ({
  type: "AwaitExpression",
  value,
});

/**
 * @type {(
 *   delegate: boolean,
 *   value: Expression,
 * ) => Expression}
 */
export const makeYieldExpression = (delegate, value) => ({
  type: "YieldExpression",
  delegate,
  value,
});

/**
 * @type {(
 *   effect: Effect,
 *   value: Expression,
 * ) => Expression}
 */
export const makeSequenceExpression = (effect, value) => ({
  type: "SequenceExpression",
  effect,
  value,
});

/**
 * @type {(
 *   test: Expression,
 *   consequent: Expression,
 *   alternate: Expression,
 * ) => Expression}
 */
export const makeConditionalExpression = (test, consequent, alternate) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
});

/** @type {(argument: Expression) => Expression} */
export const makeEvalExpression = (argument) => ({
  type: "EvalExpression",
  argument,
});

/**
 * @type {(
 *   callee: Expression,
 *   this_: Expression,
 *   arguments_: Expression[],
 * ) => Expression}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
});

/**
 * @type {(
 *   callee: Expression,
 *   arguments_: Expression[],
 * ) => Expression}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
});
