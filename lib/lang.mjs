import { StaticError, hasOwn, some } from "./util/index.mjs";

const { BigInt, String, undefined } = globalThis;

/////////////////
// Enumeration //
/////////////////

/** @type {Record<aran.Parameter, null>} */
export const PARAMETER_ENUM = {
  "this": null,
  "new.target": null,
  "import": null,
  "function.arguments": null,
  "catch.error": null,
  "import.meta": null,
  "super.call": null,
  "super.get": null,
  "super.set": null,
  "scope.read": null,
  "scope.typeof": null,
  "scope.write": null,
  "private.get": null,
  "private.set": null,
};

/** @type {Record<aran.Intrinsic, null>} */
export const INTRINSIC_ENUM = {
  // Aran //
  "aran.cache": null,
  "aran.record.variables": null,
  "aran.record.values": null,
  "aran.global": null,
  "aran.unary": null,
  "aran.binary": null,
  "aran.throw": null,
  "aran.createObject": null,
  "aran.get": null,
  "aran.set": null,
  "aran.delete": null,
  "aran.deadzone": null,
  "aran.AranError": null,
  "aran.asynchronousGeneratorPrototype": null,
  "aran.generatorPrototype": null,
  "aran.readGlobal": null,
  "aran.writeGlobal": null,
  "aran.typeofGlobal": null,
  "aran.private": null,
  "aran.hidden.cache": null,
  // Grabbable //
  "globalThis": null,
  "Object": null, // Convertion inside destructuring pattern + super
  "Reflect.defineProperty": null, // Proxy Arguments trap :(
  "eval": null,
  "Symbol": null,
  "Symbol.unscopables": null,
  "Symbol.asyncIterator": null,
  "Symbol.iterator": null,
  "Symbol.isConcatSpreadable": null,
  "Function.prototype.arguments@get": null,
  "Function.prototype.arguments@set": null,
  "Array.prototype.values": null,
  "Object.prototype": null,
  // Convertion //
  "String": null,
  // Object
  "Array.from": null,
  "Array.prototype.flat": null,
  // Construction //
  "Object.create": null,
  "Array.of": null,
  "Proxy": null,
  "RegExp": null,
  "TypeError": null,
  "ReferenceError": null,
  "SyntaxError": null,
  // Readers //
  "Reflect.get": null,
  "Reflect.has": null,
  "Reflect.construct": null,
  "Reflect.apply": null,
  "Reflect.setProtoypeOf": null,
  "Reflect.getPrototypeOf": null,
  "Reflect.ownKeys": null,
  "Reflect.isExtensible": null,
  "Object.keys": null,
  "Array.prototype.concat": null,
  "Array.prototype.includes": null,
  "Array.prototype.slice": null,
  // Writers //
  "Reflect.set": null,
  "Reflect.deleteProperty": null,
  "Reflect.setPrototypeOf": null,
  // "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor": null,
  "Reflect.preventExtensions": null,
  "Object.fromEntries": null,
  "Object.entries": null,
  "Object.assign": null,
  "Object.freeze": null,
  "Object.defineProperty": null,
  "Object.setPrototypeOf": null,
  "Object.preventExtensions": null,
  "Array.prototype.fill": null,
  "Array.prototype.push": null,
  "WeakMap": null,
  "WeakMap.prototype.get": null,
  "WeakMap.prototype.set": null,
  "WeakMap.prototype.has": null,
};

///////////////
// Primitive //
///////////////

/** @type {(primitive: aran.Primitive) => primitive is {undefined: null}} */
export const isUndefinedPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "undefined");

/** @type {(primitive: aran.Primitive) => primitive is {bigint: string}} */
export const isBigIntPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "bigint");

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
  if (isBigIntPrimitive(primitive)) {
    return BigInt(primitive.bigint);
  } else if (isUndefinedPrimitive(primitive)) {
    return undefined;
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
 * @type {(
 *   input: string,
 * ) => input is aran.Parameter}
 */
export const isParameter = (input) => hasOwn(PARAMETER_ENUM, input);

/**
 * @type {(
 *   input: string,
 * ) => input is aran.Parameter}
 */
export const isIntrinsic = (input) => hasOwn(INTRINSIC_ENUM, input);

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
  node.type === "FunctionExpression" ||
  node.type === "AwaitExpression" ||
  node.type === "YieldExpression" ||
  node.type === "SequenceExpression" ||
  node.type === "ConditionalExpression" ||
  node.type === "EvalExpression" ||
  node.type === "ApplyExpression" ||
  node.type === "ConstructExpression";

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => aran.Node<A>[]} */
export const listChild = (node) => {
  switch (node.type) {
    // Program //
    case "ScriptProgram":
      return [node.body];
    case "ModuleProgram":
      return [node.body];
    case "EvalProgram":
      return [node.body];
    // Link //
    case "ImportLink":
      return [];
    case "ExportLink":
      return [];
    case "AggregateLink":
      return [];
    // Block //
    case "ControlBlock":
      return node.statements;
    case "ClosureBlock":
      return [...node.statements, node.completion];
    case "PseudoBlock":
      return [...node.statements, node.completion];
    // Statement //
    case "EffectStatement":
      return [node.inner];
    case "ReturnStatement":
      return [node.result];
    case "BreakStatement":
      return [];
    case "DebuggerStatement":
      return [];
    case "DeclareEnclaveStatement":
      return [node.right];
    case "BlockStatement":
      return [node.do];
    case "IfStatement":
      return [node.if, node.then, node.else];
    case "WhileStatement":
      return [node.while, node.do];
    case "TryStatement":
      return [node.try, node.catch, node.finally];
    // Effect //
    case "ConditionalEffect":
      return [node.condition, ...node.positive, ...node.negative];
    case "WriteEffect":
      return [node.right];
    case "WriteEnclaveEffect":
      return [node.right];
    case "ExportEffect":
      return [node.right];
    case "ExpressionEffect":
      return [node.discard];
    // Expression //
    case "PrimitiveExpression":
      return [];
    case "IntrinsicExpression":
      return [];
    case "ImportExpression":
      return [];
    case "ReadExpression":
      return [];
    case "ReadEnclaveExpression":
      return [];
    case "TypeofEnclaveExpression":
      return [];
    case "FunctionExpression":
      return [node.body];
    case "AwaitExpression":
      return [node.promise];
    case "YieldExpression":
      return [node.item];
    case "SequenceExpression":
      return [node.head, node.tail];
    case "ConditionalExpression":
      return [node.condition, node.consequent, node.alternate];
    case "EvalExpression":
      return [node.code];
    case "ApplyExpression":
      return [node.callee, node.this, ...node.arguments];
    case "ConstructExpression":
      return [node.callee, ...node.arguments];
    default:
      throw new StaticError("invalid node", node);
  }
};

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => boolean} */
export const hasImportParameter = (node) =>
  (node.type === "ReadExpression" && node.variable === "import") ||
  some(listChild(node), hasImportParameter);

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => boolean} */
export const hasSuperGetParameter = (node) => {
  if (node.type === "FunctionExpression" && node.kind !== "arrow") {
    return false;
  } else if (node.type === "ReadExpression" && node.variable === "super.get") {
    return true;
  } else {
    return some(listChild(node), hasSuperGetParameter);
  }
};

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => boolean} */
export const hasSuperSetParameter = (node) => {
  if (node.type === "FunctionExpression" && node.kind !== "arrow") {
    return false;
  } else if (node.type === "ReadExpression" && node.variable === "super.set") {
    return true;
  } else {
    return some(listChild(node), hasSuperSetParameter);
  }
};

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => boolean} */
export const hasSuperCallParameter = (node) => {
  if (node.type === "FunctionExpression" && node.kind !== "arrow") {
    return false;
  } else if (node.type === "ReadExpression" && node.variable === "super.call") {
    return true;
  } else {
    return some(listChild(node), hasSuperCallParameter);
  }
};
