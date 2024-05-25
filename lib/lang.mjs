import { AranError, AranTypeError } from "./error.mjs";
import {
  hasNarrowKey,
  hasNarrowObject,
  hasOwn,
  reduce,
  some,
} from "./util/index.mjs";

const {
  BigInt,
  String,
  Number: { NEGATIVE_INFINITY, POSITIVE_INFINITY },
} = globalThis;

/////////////////
// Enumeration //
/////////////////

/** @type {Record<aran.Parameter, null>} */
export const PARAMETER_RECORD = {
  "this": null,
  "new.target": null,
  "import.dynamic": null,
  "function.arguments": null,
  "function.callee": null,
  "catch.error": null,
  "import.meta": null,
  "super.call": null,
  "super.get": null,
  "super.set": null,
  "scope.read": null,
  "scope.write": null,
  "scope.typeof": null,
  "scope.discard": null,
  "private.get": null,
  "private.set": null,
  "private.has": null,
};

/** @type {Record<aran.AranIntrinsic, null>} */
export const ARAN_INTRINSIC_RECORD = {
  "aran.global": null,
  "aran.record": null,
  "aran.unary": null,
  "aran.binary": null,
  "aran.throw": null,
  "aran.get": null,
  "aran.deadzone": null,
  "aran.listRest": null,
  "aran.listForInKey": null,
  "aran.toPropertyKey": null,
  "aran.AsyncGeneratorFunction.prototype.prototype": null,
  "aran.GeneratorFunction.prototype.prototype": null,
  "aran.createObject": null,
};

/** @type {Record<aran.Intrinsic, null>} */
export const INTRINSIC_RECORD = {
  // Aran //
  ...ARAN_INTRINSIC_RECORD,
  // Grabbable //
  "Function": null,
  "undefined": null,
  "globalThis": null,
  "Object": null, // Convertion inside destructuring pattern + super
  "Object.hasOwn": null,
  "Reflect.defineProperty": null, // Proxy Arguments trap :(
  "eval": null,
  "Symbol": null,
  "Symbol.prototype.description@get": null,
  "Symbol.unscopables": null,
  "Symbol.asyncIterator": null,
  "Symbol.iterator": null,
  "Symbol.toStringTag": null,
  "Symbol.isConcatSpreadable": null,
  "Function.prototype": null,
  "Function.prototype.arguments@get": null,
  "Function.prototype.arguments@set": null,
  "Array.prototype.values": null,
  "Object.prototype": null,
  "Number.NEGATIVE_INFINITY": null,
  "Number.POSITIVE_INFINITY": null,
  // Convertion //
  "String": null,
  "Number": null,
  // Object
  "Array.from": null,
  "Array.prototype.flat": null,
  // String //
  "String.prototype.concat": null,
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
  "WeakSet": null,
  "WeakSet.prototype.add": null,
  "WeakSet.prototype.has": null,
  "Map": null,
  "Map.prototype.has": null,
  "Map.prototype.get": null,
  "Map.prototype.set": null,
};

///////////////
// Primitive //
///////////////

/** @type {(primitive: aran.Primitive) => primitive is {bigint: string}} */
export const isBigIntPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "bigint");

/**
 * @type {(
 *   primitive: null | boolean | number | string | bigint,
 * ) => aran.Primitive}
 */
export const packPrimitive = (primitive) => {
  if (primitive === POSITIVE_INFINITY) {
    throw new AranError("Cannot pack positive infinity");
  } else if (primitive === NEGATIVE_INFINITY) {
    throw new AranError("Cannot pack negative infinity");
  } else if (primitive === 0) {
    if (primitive / 0 < 0) {
      throw new AranError("Cannot pack negative zero");
    } else {
      return 0;
    }
  } else if (typeof primitive === "bigint") {
    return { bigint: String(primitive) };
  } else {
    return primitive;
  }
};

/**
 * @type {(
 *   primitive: aran.Primitive,
 * ) => null | boolean | number | string | bigint}
 */
export const unpackPrimitive = (primitive) => {
  if (isBigIntPrimitive(primitive)) {
    return BigInt(primitive.bigint);
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
 * @type {<X extends string>(
 *   input: aran.Parameter | X,
 * ) => input is aran.Parameter}
 */
export const isParameter = (input) => hasNarrowKey(PARAMETER_RECORD, input);

/**
 * @type {(
 *   input: string,
 * ) => input is aran.Intrinsic}
 */
export const isIntrinsic = (input) => hasNarrowKey(INTRINSIC_RECORD, input);

/**
 * @type {(
 *   input: string,
 * ) => input is aran.AranIntrinsic}
 */
export const isAranIntrinsic = (input) =>
  hasNarrowKey(ARAN_INTRINSIC_RECORD, input);

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Program<A>}
 */
export const isProgramNode = (node) => node.type === "Program";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.ControlBlock<A>}
 */
export const isControlBlockNode = (node) => node.type === "ControlBlock";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.RoutineBlock<A>}
 */
export const isRoutineBlockNode = (node) => node.type === "RoutineBlock";

/**
 * @type {Record<aran.Statement<any>["type"], null>}
 */
export const STATEMENT_TYPE_RECORD = {
  EffectStatement: null,
  ReturnStatement: null,
  DebuggerStatement: null,
  BreakStatement: null,
  BlockStatement: null,
  IfStatement: null,
  WhileStatement: null,
  TryStatement: null,
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Statement<A>}
 */
export const isStatementNode = (node) =>
  hasNarrowKey(STATEMENT_TYPE_RECORD, node.type);

/**
 * @type {Record<aran.Effect<any>["type"], null>}
 */
export const EFFECT_TYPE_RECORD = {
  ConditionalEffect: null,
  WriteEffect: null,
  ExportEffect: null,
  ExpressionEffect: null,
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Effect<A>}
 */
export const isEffectNode = (node) =>
  hasNarrowKey(EFFECT_TYPE_RECORD, node.type);

/**
 * @type {Record<aran.Expression<any>["type"], null>}
 */
export const EXPRESSION_TYPE_RECORD = {
  PrimitiveExpression: null,
  IntrinsicExpression: null,
  ImportExpression: null,
  ReadExpression: null,
  ClosureExpression: null,
  AwaitExpression: null,
  YieldExpression: null,
  SequenceExpression: null,
  ConditionalExpression: null,
  EvalExpression: null,
  ApplyExpression: null,
  ConstructExpression: null,
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 * ) => node is aran.Expression<A>}
 */
export const isExpressionNode = (node) =>
  hasNarrowKey(EXPRESSION_TYPE_RECORD, node.type);

/**
 * @type {Record<aran.Node<any>["type"], null>}
 */
export const TYPE_RECORD = {
  Program: null,
  RoutineBlock: null,
  ControlBlock: null,
  ...STATEMENT_TYPE_RECORD,
  ...EFFECT_TYPE_RECORD,
  ...EXPRESSION_TYPE_RECORD,
};

/**
 * @type {<A extends aran.Atom>(
 *   node: object
 * ) => node is aran.Node<A>}
 */
export const isAranNode = (node) =>
  hasNarrowObject(node, "type") &&
  typeof node.type === "string" &&
  hasNarrowKey(TYPE_RECORD, node.type);

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => aran.Node<A>[]} */
export const listChild = (node) => {
  switch (node.type) {
    // Program //
    case "Program": {
      return [node.body];
    }
    // Block //
    case "ControlBlock": {
      return node.body;
    }
    case "RoutineBlock": {
      return [...node.body, node.completion];
    }
    // Statement //
    case "EffectStatement": {
      return [node.inner];
    }
    case "ReturnStatement": {
      return [node.result];
    }
    case "BreakStatement": {
      return [];
    }
    case "DebuggerStatement": {
      return [];
    }
    case "BlockStatement": {
      return [node.body];
    }
    case "IfStatement": {
      return [node.test, node.then, node.else];
    }
    case "WhileStatement": {
      return [node.test, node.body];
    }
    case "TryStatement": {
      return [node.try, node.catch, node.finally];
    }
    // Effect //
    case "ConditionalEffect": {
      return [node.test, ...node.positive, ...node.negative];
    }
    case "WriteEffect": {
      return [node.value];
    }
    case "ExportEffect": {
      return [node.value];
    }
    case "ExpressionEffect": {
      return [node.discard];
    }
    // Expression //
    case "PrimitiveExpression": {
      return [];
    }
    case "IntrinsicExpression": {
      return [];
    }
    case "ImportExpression": {
      return [];
    }
    case "ReadExpression": {
      return [];
    }
    case "ClosureExpression": {
      return [node.body];
    }
    case "AwaitExpression": {
      return [node.promise];
    }
    case "YieldExpression": {
      return [node.item];
    }
    case "SequenceExpression": {
      return [...node.head, node.tail];
    }
    case "ConditionalExpression": {
      return [node.test, node.consequent, node.alternate];
    }
    case "EvalExpression": {
      return [node.code];
    }
    case "ApplyExpression": {
      return [node.callee, node.this, ...node.arguments];
    }
    case "ConstructExpression": {
      return [node.callee, ...node.arguments];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Node<A>,
 *   predicate: (child: aran.Node<A>) => boolean,
 * ) => boolean}
 */
export const someChild = (node, predicate) => {
  switch (node.type) {
    // Program //
    case "Program": {
      return predicate(node.body);
    }
    // Block //
    case "ControlBlock": {
      return some(node.body, predicate);
    }
    case "RoutineBlock": {
      return some(node.body, predicate) || predicate(node.completion);
    }
    // Statement //
    case "EffectStatement": {
      return predicate(node.inner);
    }
    case "ReturnStatement": {
      return predicate(node.result);
    }
    case "BreakStatement": {
      return false;
    }
    case "DebuggerStatement": {
      return false;
    }
    case "BlockStatement": {
      return predicate(node.body);
    }
    case "IfStatement": {
      return (
        predicate(node.test) || predicate(node.then) || predicate(node.else)
      );
    }
    case "WhileStatement": {
      return predicate(node.test) || predicate(node.body);
    }
    case "TryStatement": {
      return (
        predicate(node.try) || predicate(node.catch) || predicate(node.finally)
      );
    }
    // Effect //
    case "ConditionalEffect": {
      return (
        predicate(node.test) ||
        some(node.positive, predicate) ||
        some(node.negative, predicate)
      );
    }
    case "WriteEffect": {
      return predicate(node.value);
    }
    case "ExportEffect": {
      return predicate(node.value);
    }
    case "ExpressionEffect": {
      return predicate(node.discard);
    }
    // Expression //
    case "PrimitiveExpression": {
      return false;
    }
    case "IntrinsicExpression": {
      return false;
    }
    case "ImportExpression": {
      return false;
    }
    case "ReadExpression": {
      return false;
    }
    case "ClosureExpression": {
      return predicate(node.body);
    }
    case "AwaitExpression": {
      return predicate(node.promise);
    }
    case "YieldExpression": {
      return predicate(node.item);
    }
    case "SequenceExpression": {
      return some(node.head, predicate) || predicate(node.tail);
    }
    case "ConditionalExpression": {
      return (
        predicate(node.test) ||
        predicate(node.consequent) ||
        predicate(node.alternate)
      );
    }
    case "EvalExpression": {
      return predicate(node.code);
    }
    case "ApplyExpression": {
      return (
        predicate(node.callee) ||
        predicate(node.this) ||
        some(node.arguments, predicate)
      );
    }
    case "ConstructExpression": {
      return predicate(node.callee) || some(node.arguments, predicate);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {<X, A extends aran.Atom>(
 *   node: aran.Node<A>,
 *   accumulate: (
 *     accumulation: X,
 *     node: aran.Node<A>,
 *   ) => X,
 *   initial: X,
 * ) => X}
 */
export const reduceChild = (node, accumulate, initial) => {
  switch (node.type) {
    // Program //
    case "Program": {
      return accumulate(initial, node.body);
    }
    // Block //
    case "ControlBlock": {
      return reduce(node.body, accumulate, initial);
    }
    case "RoutineBlock": {
      return accumulate(
        reduce(node.body, accumulate, initial),
        node.completion,
      );
    }
    // Statement //
    case "EffectStatement": {
      return accumulate(initial, node.inner);
    }
    case "ReturnStatement": {
      return accumulate(initial, node.result);
    }
    case "BreakStatement": {
      return initial;
    }
    case "DebuggerStatement": {
      return initial;
    }
    case "BlockStatement": {
      return accumulate(initial, node.body);
    }
    case "IfStatement": {
      return accumulate(
        accumulate(accumulate(initial, node.test), node.then),
        node.else,
      );
    }
    case "WhileStatement": {
      return accumulate(accumulate(initial, node.test), node.body);
    }
    case "TryStatement": {
      return accumulate(
        accumulate(accumulate(initial, node.try), node.catch),
        node.finally,
      );
    }
    // Effect //
    case "ConditionalEffect": {
      return reduce(
        node.negative,
        accumulate,
        reduce(node.positive, accumulate, accumulate(initial, node.test)),
      );
    }
    case "WriteEffect": {
      return accumulate(initial, node.value);
    }
    case "ExportEffect": {
      return accumulate(initial, node.value);
    }
    case "ExpressionEffect": {
      return accumulate(initial, node.discard);
    }
    // Expression //
    case "PrimitiveExpression": {
      return initial;
    }
    case "IntrinsicExpression": {
      return initial;
    }
    case "ImportExpression": {
      return initial;
    }
    case "ReadExpression": {
      return initial;
    }
    case "ClosureExpression": {
      return accumulate(initial, node.body);
    }
    case "AwaitExpression": {
      return accumulate(initial, node.promise);
    }
    case "YieldExpression": {
      return accumulate(initial, node.item);
    }
    case "SequenceExpression": {
      return reduce(node.head, accumulate, accumulate(initial, node.tail));
    }
    case "ConditionalExpression": {
      return accumulate(
        accumulate(accumulate(initial, node.test), node.consequent),
        node.alternate,
      );
    }
    case "EvalExpression": {
      return accumulate(initial, node.code);
    }
    case "ApplyExpression": {
      return reduce(
        node.arguments,
        accumulate,
        accumulate(accumulate(initial, node.callee), node.this),
      );
    }
    case "ConstructExpression": {
      return reduce(
        node.arguments,
        accumulate,
        accumulate(initial, node.callee),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
