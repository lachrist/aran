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
