import { StaticError, hasOwn, includes } from "./util/index.mjs";

const { BigInt, String, undefined } = globalThis;

/////////////////
// Enumeration //
/////////////////

/** @type {Parameter[]} */
export const PARAMETER_ENUM = [
  "this",
  "new.target",
  "import",
  "function.arguments",
  "catch.error",
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

///////////////
// Primitive //
///////////////

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
    } /* c8 ignore start */ else {
      throw new StaticError("invalid primitive", primitive);
    } /* c8 ignore stop */
  } else {
    return primitive;
  }
};

/////////
// Tag //
/////////

/** @type {<T>(node: Node<T>) => T} */
export const getNodeTag = ({ tag }) => tag;

/** @type {<T, N extends Node<T>>(node: N, tag: T) => N} */
export const setNodeTag = (node, tag) => ({ ...node, tag });

///////////
// Query //
///////////

/** @type {<T>(input: string) => input is Parameter} */
export const isParameter = (input) => includes(PARAMETER_ENUM, input);

/** @type {<T>(node: Node<T>) => node is Program<T>} */
export const isProgramNode = (node) =>
  node.type === "ScriptProgram" ||
  node.type === "ModuleProgram" ||
  node.type === "EvalProgram";

/** @type {<T>(node: Node<T>) => node is Link<T>} */
export const isLinkNode = (node) =>
  node.type === "ImportLink" ||
  node.type === "ExportLink" ||
  node.type === "AggregateLink";

/** @type {<T>(node: Node<T>) => node is PseudoBlock<T>} */
export const isPseudoBlockNode = (node) => node.type === "PseudoBlock";

/** @type {<T>(node: Node<T>) => node is ControlBlock<T>} */
export const isControlBlockNode = (node) => node.type === "ControlBlock";

/** @type {<T>(node: Node<T>) => node is ClosureBlock<T>} */
export const isClosureBlockNode = (node) => node.type === "ClosureBlock";

/** @type {<T>(node: Node<T>) => node is Statement<T>} */
export const isStatementNode = (node) =>
  node.type === "EffectStatement" ||
  node.type === "DeclareEnclaveStatement" ||
  node.type === "ReturnStatement" ||
  node.type === "DebuggerStatement" ||
  node.type === "BreakStatement" ||
  node.type === "BlockStatement" ||
  node.type === "IfStatement" ||
  node.type === "TryStatement" ||
  node.type === "WhileStatement";

/** @type {<T>(node: Node<T>) => node is Effect<T>} */
export const isEffectNode = (node) =>
  node.type === "ExpressionEffect" ||
  node.type === "ConditionalEffect" ||
  node.type === "WriteEffect" ||
  node.type === "WriteEnclaveEffect" ||
  node.type === "ExportEffect";

/** @type {<T>(node: Node<T>) => node is Expression<T>} */
export const isExpressionNode = (node) =>
  node.type === "PrimitiveExpression" ||
  node.type === "ParameterExpression" ||
  node.type === "ImportExpression" ||
  node.type === "IntrinsicExpression" ||
  node.type === "ReadExpression" ||
  node.type === "ReadEnclaveExpression" ||
  node.type === "TypeofEnclaveExpression" ||
  node.type === "ClosureExpression" ||
  node.type === "AwaitExpression" ||
  node.type === "YieldExpression" ||
  node.type === "SequenceExpression" ||
  node.type === "ConditionalExpression" ||
  node.type === "EvalExpression" ||
  node.type === "ApplyExpression" ||
  node.type === "ConstructExpression";

/* c8 ignore start */

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
 *   links: Link<T>[],
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

//////////
// Link //
//////////

/** @type {<T>(source: Source, import_: Specifier | null, tag: T) => Link<T>} */
export const makeImportLink = (source, import_, tag) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag,
});

/** @type {<T>(export_: Specifier, tag: T) => Link<T>} */
export const makeExportLink = (export_, tag) => ({
  type: "ExportLink",
  export: export_,
  tag,
});

/**
 * @type {<T>(
 *   source: Source,
 *   import_: Specifier | null,
 *   export_: Specifier | null,
 *   tag: T,
 * ) => Link<T>}
 */
export const makeAggregateLink = (source, import_, export_, tag) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag,
});

///////////
// Block //
///////////

/**
 * @type {<T>(
 *   labels: Label[],
 *   variables: Variable[],
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
 *   variables: Variable[],
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
 *   variable: Variable,
 *   right: Expression<T>,
 *   tag: T,
 * ) => Statement<T>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right, tag) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
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

/** @type {<T>(label: Label, tag: T) => Statement<T>} */
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

/** @type {<T>(conditional: Expression<T>, positive: Effect<T>[], negative: Effect<T>[], tag: T) => Effect<T>} */
export const makeConditionalEffect = (condition, positive, negative, tag) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag,
});

/** @type {<T>(variable: Variable, value: Expression<T>, tag: T) => Effect<T>} */
export const makeWriteEffect = (variable, right, tag) => ({
  type: "WriteEffect",
  variable,
  right,
  tag,
});

/** @type {<T>(variable: Variable, value: Expression<T>, tag: T) => Effect<T>} */
export const makeWriteEnclaveEffect = (variable, right, tag) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<T>(
 *   export_: Specifier,
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
 *   source: Source,
 *   import_: Specifier | null,
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

/** @type {<T>(variable: Variable, tag: T) => Expression<T>} */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/** @type {<T>(variable: Variable, tag: T) => Expression<T>} */
export const makeReadEnclaveExpression = (variable, tag) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag,
});

/** @type {<T>(variable: Variable, tag: T) => Expression<T>} */
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
