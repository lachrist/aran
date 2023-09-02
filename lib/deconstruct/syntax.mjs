import { hasOwn } from "../util/index.mjs";

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

/** @type {<T, N extends Node<T>>(node: N, tag: T) => N} */
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

/** @type {<T>(body: PseudoBlock<T>, tag: T) => Program<T>} */
export const makeScriptProgram = (body, tag) => ({
  type: "ScriptProgram",
  body,
  tag,
});

/**
 * @type {<T>(
 *   links: Link[],
 *   body: ClosureBlock<T>,
 *   tag: T,
 * ) => Program<T>}
 */
export const makeModuleProgram = (links, body, tag) => ({
  type: "ModuleProgram",
  links,
  body,
  tag,
});

/** @type {<T>(body: ClosureBlock<T>, tag: T) => Program<T>} */
export const makeEvalProgram = (body, tag) => ({
  type: "EvalProgram",
  body,
  tag,
});

///////////
// Block //
///////////

/**
 * @type {<T>(
 *   labels: string[],
 *   variables: string[],
 *   statements: Statement<T>[],
 *   tag: T
 * ) => ControlBlock<T>}
 */
export const makeControlBlock = (labels, variables, statements, tag) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag,
});

/**
 * @type {<T>(
 *   variables: string[],
 *   statements: Statement<T>[],
 *   completion: Expression<T>,
 *   tag: T
 * ) => ClosureBlock<T>}
 */
export const makeClosureBlock = (variables, statements, completion, tag) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag,
});

/**
 * @type {<T>(
 *   statements: Statement<T>[],
 *   completion: Expression<T>,
 *   tag: T
 * ) => PseudoBlock<T>}
 */
export const makePseudoBlock = (statements, completion, tag) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag,
});

///////////////
// Statement //
///////////////

/** @type {<T>(inner: Effect<T>, tag: T) => Statement<T>} */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {<T>(
 *   kind: VariableKind,
 *   variable: string,
 *   value: Expression<T>,
 *   tag: T,
 * ) => Statement<T>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, value, tag) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  value,
  tag,
});

/** @type {<T>(result: Expression<T>, tag: T) => Statement<T>} */
export const makeReturnStatement = (result, tag) => ({
  type: "ReturnStatement",
  result,
  tag,
});

/** @type {<T>(tag: T) => Statement<T>} */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/** @type {<T>(label: string, tag: T) => Statement<T>} */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/** @type {<T>(do_: ControlBlock<T>, tag: T) => Statement<T>} */
export const makeBlockStatement = (do_, tag) => ({
  type: "BlockStatement",
  do: do_,
  tag,
});

/**
 * @type {<T>(
 *   if_: Expression<T>,
 *   then_: ControlBlock<T>,
 *   else_: ControlBlock<T>,
 *   tag: T,
 * ) => Statement<T>}
 */
export const makeIfStatement = (if_, then_, else_, tag) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {<T>(
 *   try_: ControlBlock<T>,
 *   catch_: ControlBlock<T>,
 *   finally_: ControlBlock<T>,
 *   tag: T,
 * ) => Statement<T>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {<T>(
 *   while_: Expression<T>,
 *   do_: ControlBlock<T>,
 *   tag: T,
 * ) => Statement<T>}
 */
export const makeWhileStatement = (while_, do_, tag) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag,
});

////////////
// Effect //
////////////

/** @type {<T>(discard: Expression<T>, tag: T) => Effect<T>} */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/** @type {<T>(variable: string, value: Expression<T>, tag: T) => Effect<T>} */
export const makeWriteEffect = (variable, right, tag) => ({
  type: "WriteEffect",
  variable,
  right,
  tag,
});

/** @type {<T>(variable: string, value: Expression<T>, tag: T) => Effect<T>} */
export const makeWriteEnclaveEffect = (variable, right, tag) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<T>(
 *   export_: string,
 *   value: Expression<T>,
 *   tag: T,
 * ) => Effect<T>}
 */
export const makeExportEffect = (export_, right, tag) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag,
});

////////////////
// Expression //
////////////////

/** @type {<T>(primitive: PackPrimitive, tag: T) => Expression<T>} */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/** @type {<T>(parameter: Parameter, tag: T) => Expression<T>} */
export const makeParameterExpression = (parameter, tag) => ({
  type: "ParameterExpression",
  parameter,
  tag,
});

/**
 * @type {<T>(
 *   source: string,
 *   import_: string | null,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/** @type {<T>(intrinsic: Intrinsic, tag: T) => Expression<T>} */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/** @type {<T>(variable: string, tag: T) => Expression<T>} */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/** @type {<T>(variable: string, tag: T) => Expression<T>} */
export const makeReadEnclaveExpression = (variable, tag) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag,
});

/** @type {<T>(variable: string, tag: T) => Expression<T>} */
export const makeTypeofEnclaveExpression = (variable, tag) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag,
});

/**
 * @type {<T>(
 *   kind: ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: ClosureBlock<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeClosureExpression = (
  kind,
  asynchronous,
  generator,
  body,
  tag,
) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag,
});

/** @type {<T>(promise: Expression<T>, tag: T) => Expression<T>} */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {<T>(
 *   delegate: boolean,
 *   item: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {<T>(
 *   head: Effect<T>,
 *   tail: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeSequenceExpression = (head, tail, tag) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag,
});

/**
 * @type {<T>(
 *   condition: Expression<T>,
 *   consequent: Expression<T>,
 *   alternate: Expression<T>,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
  tag,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
  tag,
});

/** @type {<T>(code: Expression<T>, tag: T) => Expression<T>} */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {<T>(
 *   callee: Expression<T>,
 *   this_: Expression<T>,
 *   arguments_: Expression<T>[],
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {<T>(
 *   callee: Expression<T>,
 *   arguments_: Expression<T>[],
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
