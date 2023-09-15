import { StaticError, hasOwn, includes } from "./util/index.mjs";

const { BigInt, String, undefined } = globalThis;

/////////////////
// Enumeration //
/////////////////

/** @type {aran.Parameter[]} */
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

/** @type {aran.Intrinsic[]} */
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

/** @type {(primitive: Primitive) => aran.Primitive} */
export const packPrimitive = (primitive) => {
  if (primitive === undefined) {
    return { undefined: null };
  } else if (typeof primitive === "bigint") {
    return { bigint: String(primitive) };
  } else {
    return primitive;
  }
};

/** @type {(primitive: aran.Primitive) => Primitive} */
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

/** @type {<V, T>(node: aran.Node<V, T>) => T} */
export const getNodeTag = ({ tag }) => tag;

/** @type {<V, T, N extends aran.Node<V, T>>(node: N, tag: T) => N} */
export const setNodeTag = (node, tag) => ({ ...node, tag });

///////////
// Query //
///////////

/** @type {<V, T>(input: string) => input is aran.Parameter} */
export const isParameter = (input) => includes(PARAMETER_ENUM, input);

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.Program<V, T>} */
export const isProgramNode = (node) =>
  node.type === "ScriptProgram" ||
  node.type === "ModuleProgram" ||
  node.type === "EvalProgram";

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.Link<T>} */
export const isLinkNode = (node) =>
  node.type === "ImportLink" ||
  node.type === "ExportLink" ||
  node.type === "AggregateLink";

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.PseudoBlock<V, T>} */
export const isPseudoBlockNode = (node) => node.type === "PseudoBlock";

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.ControlBlock<V, T>} */
export const isControlBlockNode = (node) => node.type === "ControlBlock";

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.ClosureBlock<V, T>} */
export const isClosureBlockNode = (node) => node.type === "ClosureBlock";

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.Statement<V, T>} */
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

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.Effect<V, T>} */
export const isEffectNode = (node) =>
  node.type === "ExpressionEffect" ||
  node.type === "ConditionalEffect" ||
  node.type === "WriteEffect" ||
  node.type === "WriteEnclaveEffect" ||
  node.type === "ExportEffect";

/** @type {<V, T>(node: aran.Node<V, T>) => node is aran.Expression<V, T>} */
export const isExpressionNode = (node) =>
  node.type === "PrimitiveExpression" ||
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

/** @type {<V, T>(body: aran.PseudoBlock<V, T>, tag: T) => aran.Program<V, T>} */
export const makeScriptProgram = (body, tag) => ({
  type: "ScriptProgram",
  body,
  tag,
});

/**
 * @type {<V, T>(
 *   links: aran.Link<T>[],
 *   body: aran.ClosureBlock<V, T>,
 *   tag: T,
 * ) => aran.Program<V, T>}
 */
export const makeModuleProgram = (links, body, tag) => ({
  type: "ModuleProgram",
  links,
  body,
  tag,
});

/** @type {<V, T>(body: aran.ClosureBlock<V, T>, tag: T) => aran.Program<V, T>} */
export const makeEvalProgram = (body, tag) => ({
  type: "EvalProgram",
  body,
  tag,
});

//////////
// Link //
//////////

/**
 * @type {<V, T>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: T,
 * ) => aran.Link<T>}
 */
export const makeImportLink = (source, import_, tag) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag,
});

/** @type {<V, T>(export_: estree.Specifier, tag: T) => aran.Link<T>} */
export const makeExportLink = (export_, tag) => ({
  type: "ExportLink",
  export: export_,
  tag,
});

/**
 * @type {<V, T>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 *   tag: T,
 * ) => aran.Link<T>}
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
 * @type {<V, T>(
 *   labels: aran.Label[],
 *   variables: V[],
 *   statements: aran.Statement<V, T>[],
 *   tag: T
 * ) => aran.ControlBlock<V, T>}
 */
export const makeControlBlock = (labels, variables, statements, tag) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag,
});

/**
 * @type {<V, T>(
 *   variables: V[],
 *   statements: aran.Statement<V, T>[],
 *   completion: aran.Expression<V, T>,
 *   tag: T
 * ) => aran.ClosureBlock<V, T>}
 */
export const makeClosureBlock = (variables, statements, completion, tag) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag,
});

/**
 * @type {<V, T>(
 *   statements: aran.Statement<V, T>[],
 *   completion: aran.Expression<V, T>,
 *   tag: T
 * ) => aran.PseudoBlock<V, T>}
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

/** @type {<V, T>(inner: aran.Effect<V, T>, tag: T) => aran.Statement<V, T>} */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {<V, T>(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<V, T>,
 *   tag: T,
 * ) => aran.Statement<V, T>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right, tag) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
  tag,
});

/** @type {<V, T>(result: aran.Expression<V, T>, tag: T) => aran.Statement<V, T>} */
export const makeReturnStatement = (result, tag) => ({
  type: "ReturnStatement",
  result,
  tag,
});

/** @type {<V, T>(tag: T) => aran.Statement<V, T>} */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/** @type {<V, T>(label: aran.Label, tag: T) => aran.Statement<V, T>} */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/** @type {<V, T>(do_: aran.ControlBlock<V, T>, tag: T) => aran.Statement<V, T>} */
export const makeBlockStatement = (do_, tag) => ({
  type: "BlockStatement",
  do: do_,
  tag,
});

/**
 * @type {<V, T>(
 *   if_: aran.Expression<V, T>,
 *   then_: aran.ControlBlock<V, T>,
 *   else_: aran.ControlBlock<V, T>,
 *   tag: T,
 * ) => aran.Statement<V, T>}
 */
export const makeIfStatement = (if_, then_, else_, tag) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {<V, T>(
 *   try_: aran.ControlBlock<V, T>,
 *   catch_: aran.ControlBlock<V, T>,
 *   finally_: aran.ControlBlock<V, T>,
 *   tag: T,
 * ) => aran.Statement<V, T>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {<V, T>(
 *   while_: aran.Expression<V, T>,
 *   do_: aran.ControlBlock<V, T>,
 *   tag: T,
 * ) => aran.Statement<V, T>}
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

/** @type {<V, T>(discard: aran.Expression<V, T>, tag: T) => aran.Effect<V, T>} */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/**
 * @type {<V, T>(
 *   conditional: aran.Expression<V, T>,
 *   positive: aran.Effect<V, T>[],
 *   negative: aran.Effect<V, T>[],
 *   tag: T,
 * ) => aran.Effect<V, T>}
 */
export const makeConditionalEffect = (condition, positive, negative, tag) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag,
});

/**
 * @type {<V, T>(variable: V, value: aran.Expression<V, T>, tag: T) => aran.Effect<V, T>} */
export const makeWriteEffect = (variable, right, tag) => ({
  type: "WriteEffect",
  variable,
  right,
  tag,
});

/** @type {<V, T>(variable: estree.Variable, value: aran.Expression<V, T>, tag: T) => aran.Effect<V, T>} */
export const makeWriteEnclaveEffect = (variable, right, tag) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<V, T>(
 *   export_: estree.Specifier,
 *   value: aran.Expression<V, T>,
 *   tag: T,
 * ) => aran.Effect<V, T>}
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

/** @type {<V, T>(primitive: aran.Primitive, tag: T) => aran.Expression<V, T>} */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/**
 * @type {<V, T>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: T,
 * ) => aran.Expression<V, T>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/** @type {<V, T>(intrinsic: aran.Intrinsic, tag: T) => aran.Expression<V, T>} */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/** @type {<V, T>(variable: V, tag: T) => aran.Expression<V, T>} */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/** @type {<V, T>(variable: estree.Variable, tag: T) => aran.Expression<V, T>} */
export const makeReadEnclaveExpression = (variable, tag) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag,
});

/** @type {<V, T>(variable: estree.Variable, tag: T) => aran.Expression<V, T>} */
export const makeTypeofEnclaveExpression = (variable, tag) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag,
});

/**
 * @type {<V, T>(
 *   kind: aran.ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<V, T>,
 *   tag: T,
 * ) => aran.Expression<V, T>}
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

/** @type {<V, T>(promise: aran.Expression<V, T>, tag: T) => aran.Expression<V, T>} */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {<V, T>(
 *   delegate: boolean,
 *   item: aran.Expression<V, T>,
 *   tag: T,
 * ) => aran.Expression<V, T>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {<V, T>(
 *   head: aran.Effect<V, T>,
 *   tail: aran.Expression<V, T>,
 *   tag: T,
 * ) => aran.Expression<V, T>}
 */
export const makeSequenceExpression = (head, tail, tag) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag,
});

/**
 * @type {<V, T>(
 *   condition: aran.Expression<V, T>,
 *   consequent: aran.Expression<V, T>,
 *   alternate: aran.Expression<V, T>,
 *   tag: T,
 * ) => aran.Expression<V, T>}
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

/** @type {<V, T>(code: aran.Expression<V, T>, tag: T) => aran.Expression<V, T>} */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {<V, T>(
 *   callee: aran.Expression<V, T>,
 *   this_: aran.Expression<V, T>,
 *   arguments_: aran.Expression<V, T>[],
 *   tag: T,
 * ) => aran.Expression<V, T>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {<V, T>(
 *   callee: aran.Expression<V, T>,
 *   arguments_: aran.Expression<V, T>[],
 *   tag: T,
 * ) => aran.Expression<V, T>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
