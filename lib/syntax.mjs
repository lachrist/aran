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

/** @type {<N extends Node>(node: N, tag: unknown) => N} */
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

/**
 * @type {(
 *   kind: ProgramKind,
 *   links: Link[],
 *   variables: string[],
 *   body: Statement[],
 *   completion: Expression,
 * ) => Program}
 */
export const makeProgram = (kind, links, variables, body, completion) =>
  /** @type {Program} */ ({
    type: "Program",
    kind,
    links: kind === "module" ? links : [],
    variables: kind === "script" ? [] : variables,
    body,
    completion,
  });

/** @type {(body: Statement[], completion: Expression) => Program} */
export const makeScriptProgram = (body, completion) => ({
  type: "Program",
  kind: "script",
  links: [],
  variables: [],
  body,
  completion,
});

/**
 * @type {(
 *   links: Link[],
 *   variables: string[],
 *   body: Statement[],
 *   completion: Expression,
 * ) => Program}
 */
export const makeModuleProgram = (links, variables, body, completion) => ({
  type: "Program",
  kind: "module",
  links,
  variables,
  body,
  completion,
});

/**
 * @type {(
 *   variables: string[],
 *   body: Statement[],
 *   completion: Expression,
 * ) => Program}
 */
export const makeEvalProgram = (variables, body, completion) => ({
  type: "Program",
  kind: "eval",
  links: [],
  variables,
  body,
  completion,
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
export const makeBlock = (labels, variables, body) => ({
  type: "Block",
  labels,
  variables,
  body,
});

///////////////
// Statement //
///////////////

/** @type {(inner: Effect) => Statement} */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
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

/** @type {(result: Expression) => Statement} */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
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

/** @type {(naked: Block) => Statement} */
export const makeBlockStatement = (naked) => ({
  type: "BlockStatement",
  naked,
});

/**
 * @type {(
 *   if_: Expression,
 *   then_: Block,
 *   else_: Block,
 * ) => Statement}
 */
export const makeIfStatement = (if_, then_, else_) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
});

/**
 * @type {(
 *   try_: Block,
 *   catch_: Block,
 *   finally_: Block,
 * ) => Statement}
 */
export const makeTryStatement = (try_, catch_, finally_) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
});

/** @type {(while_: Expression, loop: Block) => Statement} */
export const makeWhileStatement = (while_, loop) => ({
  type: "WhileStatement",
  while: while_,
  loop,
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
export const makeWriteEffect = (variable, right) => ({
  type: "WriteEffect",
  variable,
  right,
});

/** @type {(variable: string, value: Expression) => Effect} */
export const makeWriteEnclaveEffect = (variable, right) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
});

/**
 * @type {(
 *   export_: string,
 *   value: Expression,
 * ) => Effect}
 */
export const makeExportEffect = (export_, right) => ({
  type: "ExportEffect",
  export: export_,
  right,
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
 *   variables: string[],
 *   body: Statement[],
 *   completion: Expression,
 * ) => Expression}
 */
export const makeClosureExpression = (
  kind,
  asynchronous,
  generator,
  variables,
  body,
  completion,
) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  variables,
  body,
  completion,
});

/** @type {(promise: Expression) => Expression} */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: Expression,
 * ) => Expression}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
});

/**
 * @type {(
 *   head: Effect,
 *   tail: Expression,
 * ) => Expression}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
});

/**
 * @type {(
 *   condition: Expression,
 *   consequent: Expression,
 *   alternate: Expression,
 * ) => Expression}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
});

/** @type {(code: Expression) => Expression} */
export const makeEvalExpression = (code) => ({
  type: "EvalExpression",
  code,
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
