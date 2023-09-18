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

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => A["Tag"]}
 */
export const getNodeTag = ({ tag }) => tag;

/**
 * @type {<
 *   A extends aran.Atom,
 *   N extends aran.Node<A>,
 * >(node: N, tag: A["Tag"]) => N}
 */
export const setNodeTag = (node, tag) => ({ ...node, tag });

///////////
// Query //
///////////

/**
 * @type {<A extends aran.Atom>(
 *   input: string,
 * ) => input is aran.Parameter}
 */
export const isParameter = (input) => includes(PARAMETER_ENUM, input);

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Program<A>}
 */
export const isProgramNode = (node) =>
  node.type === "ScriptProgram" ||
  node.type === "ModuleProgram" ||
  node.type === "EvalProgram";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Link<A>}
 */
export const isLinkNode = (node) =>
  node.type === "ImportLink" ||
  node.type === "ExportLink" ||
  node.type === "AggregateLink";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.PseudoBlock<A>}
 */
export const isPseudoBlockNode = (node) => node.type === "PseudoBlock";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.ControlBlock<A>}
 */
export const isControlBlockNode = (node) => node.type === "ControlBlock";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.ClosureBlock<A>}
 */
export const isClosureBlockNode = (node) => node.type === "ClosureBlock";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Statement<A>}
 */
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

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Effect<A>}
 */
export const isEffectNode = (node) =>
  node.type === "ExpressionEffect" ||
  node.type === "ConditionalEffect" ||
  node.type === "WriteEffect" ||
  node.type === "WriteEnclaveEffect" ||
  node.type === "ExportEffect";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Expression<A>}
 */
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

/**
 * @type {<A extends aran.Atom>(
 *   body: aran.PseudoBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Program<A>}
 */
export const makeScriptProgram = (body, tag) => ({
  type: "ScriptProgram",
  body,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   links: aran.Link<A>[],
 *   body: aran.ClosureBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Program<A>}
 */
export const makeModuleProgram = (links, body, tag) => ({
  type: "ModuleProgram",
  links,
  body,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   body: aran.ClosureBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Program<A>}
 */
export const makeEvalProgram = (body, tag) => ({
  type: "EvalProgram",
  body,
  tag,
});

//////////
// Link //
//////////

/**
 * @type {<A extends aran.Atom>(
 *   source: A["Source"],
 *   import_: A["Specifier"] | null,
 *   Tag: A["Tag"],
 * ) => aran.Link<A>}
 */
export const makeImportLink = (source, import_, tag) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   export_: A["Specifier"],
 *   Tag: A["Tag"],
 * ) => aran.Link<A>}
 */
export const makeExportLink = (export_, tag) => ({
  type: "ExportLink",
  export: export_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   source: A["Source"],
 *   import_: A["Specifier"] | null,
 *   export_: A["Specifier"] | null,
 *   Tag: A["Tag"],
 * ) => aran.Link<A>}
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
 * @type {<A extends aran.Atom>(
 *   labels: A["Label"][],
 *   variables: A["Variable"][],
 *   statements: aran.Statement<A>[],
 *   Tag: A["Tag"]
 * ) => aran.ControlBlock<A>}
 */
export const makeControlBlock = (labels, variables, statements, tag) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variables: A["Variable"][],
 *   statements: aran.Statement<A>[],
 *   completion: aran.Expression<A>,
 *   Tag: A["Tag"]
 * ) => aran.ClosureBlock<A>}
 */
export const makeClosureBlock = (variables, statements, completion, tag) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   statements: aran.Statement<A>[],
 *   completion: aran.Expression<A>,
 *   Tag: A["Tag"]
 * ) => aran.PseudoBlock<A>}
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

/**
 * @type {<A extends aran.Atom>(
 *   inner: aran.Effect<A>,
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   kind: aran.VariableKind,
 *   variable: A["EnclaveVariable"],
 *   right: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right, tag) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   result: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeReturnStatement = (result, tag) => ({
  type: "ReturnStatement",
  result,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   label: A["Label"],
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   do_: aran.ControlBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeBlockStatement = (do_, tag) => ({
  type: "BlockStatement",
  do: do_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   if_: aran.Expression<A>,
 *   then_: aran.ControlBlock<A>,
 *   else_: aran.ControlBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeIfStatement = (if_, then_, else_, tag) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   try_: aran.ControlBlock<A>,
 *   catch_: aran.ControlBlock<A>,
 *   finally_: aran.ControlBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   while_: aran.Expression<A>,
 *   do_: aran.ControlBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Statement<A>}
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

/**
 * @type {<A extends aran.Atom>(
 *   discard: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   conditional: aran.Expression<A>,
 *   positive: aran.Effect<A>[],
 *   negative: aran.Effect<A>[],
 *   Tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeConditionalEffect = (condition, positive, negative, tag) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variable: aran.Parameter | A["Variable"],
 *   value: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeWriteEffect = (variable, right, tag) => ({
  type: "WriteEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variable: A["EnclaveVariable"],
 *   value: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeWriteEnclaveEffect = (variable, right, tag) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   export_: A["Specifier"],
 *   value: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Effect<A>}
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

/**
 * @type {<A extends aran.Atom>(
 *   primitive: aran.Primitive,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   source: A["Source"],
 *   import_: A["Specifier"] | null,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   intrinsic: aran.Intrinsic,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variable: aran.Parameter | A["Variable"],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variable: A["EnclaveVariable"],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeReadEnclaveExpression = (variable, tag) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variable: A["EnclaveVariable"],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeTypeofEnclaveExpression = (variable, tag) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   kind: aran.ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<A>,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
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

/**
 * @type {<A extends aran.Atom>(
 *   promise: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   delegate: boolean,
 *   item: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   head: aran.Effect<A>,
 *   tail: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeSequenceExpression = (head, tail, tag) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   condition: aran.Expression<A>,
 *   consequent: aran.Expression<A>,
 *   alternate: aran.Expression<A>,
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
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

/**
 * @type {<A extends aran.Atom>(
 *   code: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   callee: aran.Expression<A>,
 *   this_: aran.Expression<A>,
 *   arguments_: aran.Expression<A>[],
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   callee: aran.Expression<A>,
 *   arguments_: aran.Expression<A>[],
 *   Tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
