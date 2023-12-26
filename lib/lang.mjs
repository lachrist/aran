import { AranTypeError } from "./error.mjs";
import { hasOwn, reduce } from "./util/index.mjs";

const {
  NaN,
  BigInt,
  String,
  undefined,
  Object: { is: same },
  Number: { isNaN, NEGATIVE_INFINITY, POSITIVE_INFINITY },
} = globalThis;

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
  "read.strict": null,
  "write.strict": null,
  "typeof.strict": null,
  "discard.strict": null,
  "read.sloppy": null,
  "write.sloppy": null,
  "typeof.sloppy": null,
  "discard.sloppy": null,
  "private.get": null,
  "private.set": null,
  "private.has": null,
};

/** @type {Record<aran.AranIntrinsic, null>} */
export const ARAN_INTRINSIC_ENUM = {
  "aran.global": null,
  "aran.templates": null,
  "aran.record": null,
  "aran.unary": null,
  "aran.binary": null,
  "aran.throw": null,
  "aran.createObject": null,
  "aran.get": null,
  "aran.deadzone": null,
  "aran.listRest": null,
  "aran.listForInKey": null,
  "aran.toPropertyKey": null,
  "aran.AsyncGeneratorFunction.prototype.prototype": null,
  "aran.GeneratorFunction.prototype.prototype": null,
};

/** @type {Record<aran.Intrinsic, null>} */
export const INTRINSIC_ENUM = {
  // Aran //
  ...ARAN_INTRINSIC_ENUM,
  // Grabbable //
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
  "WeakSet": null,
  "WeakSet.prototype.add": null,
  "WeakSet.prototype.has": null,
};

///////////////
// Primitive //
///////////////

/** @type {(primitive: aran.Primitive) => primitive is {undefined: null}} */
export const isUndefinedPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "undefined");

/** @type {(primitive: aran.Primitive) => primitive is {infinity: "+" | "-"}} */
export const isInfinityPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "infinity");

/** @type {(primitive: aran.Primitive) => primitive is {nan: null}} */
export const isNanPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "nan");

/** @type {(primitive: aran.Primitive) => primitive is {zero: "+" | "-"}} */
export const isZeroPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "zero");

/** @type {(primitive: aran.Primitive) => primitive is {bigint: string}} */
export const isBigIntPrimitive = (primitive) =>
  typeof primitive === "object" &&
  primitive !== null &&
  hasOwn(primitive, "bigint");

/** @type {(primitive: Primitive) => aran.Primitive} */
export const packPrimitive = (primitive) => {
  if (primitive === undefined) {
    return { undefined: null };
  } else if (isNaN(primitive)) {
    return { nan: null };
  } else if (primitive === POSITIVE_INFINITY) {
    return { infinity: "+" };
  } else if (primitive === NEGATIVE_INFINITY) {
    return { infinity: "-" };
  } else if (primitive === 0) {
    return { zero: same(primitive, -0) ? "-" : "+" };
  } else if (typeof primitive === "bigint") {
    return { bigint: String(primitive) };
  } else {
    return primitive;
  }
};

/** @type {(primitive: aran.Primitive) => Primitive} */
export const unpackPrimitive = (primitive) => {
  if (isUndefinedPrimitive(primitive)) {
    return undefined;
  } else if (isNanPrimitive(primitive)) {
    return NaN;
  } else if (isInfinityPrimitive(primitive)) {
    switch (primitive.infinity) {
      case "-": {
        return NEGATIVE_INFINITY;
      }
      case "+": {
        return POSITIVE_INFINITY;
      }
      default: {
        throw new AranTypeError(
          "invalid infinity primitive",
          primitive.infinity,
        );
      }
    }
  } else if (isZeroPrimitive(primitive)) {
    switch (primitive.zero) {
      case "-": {
        return -0;
      }
      case "+": {
        return 0;
      }
      default: {
        throw new AranTypeError("invalid zero primitive", primitive.zero);
      }
    }
  } else if (isBigIntPrimitive(primitive)) {
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
export const isParameter = (input) => hasOwn(PARAMETER_ENUM, input);

/**
 * @type {(
 *   input: string,
 * ) => input is aran.Intrinsic}
 */
export const isIntrinsic = (input) => hasOwn(INTRINSIC_ENUM, input);

/**
 * @type {(
 *   input: string,
 * ) => input is aran.AranIntrinsic}
 */
export const isAranIntrinsic = (input) => hasOwn(ARAN_INTRINSIC_ENUM, input);

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
  node.type === "FunctionExpression" ||
  node.type === "ArrowExpression" ||
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
    case "Program": {
      return [node.body];
    }
    // Block //
    case "ControlBlock": {
      return node.statements;
    }
    case "ClosureBlock": {
      return [...node.statements, node.completion];
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
      return [node.do];
    }
    case "IfStatement": {
      return [node.if, node.then, node.else];
    }
    case "WhileStatement": {
      return [node.while, node.do];
    }
    case "TryStatement": {
      return [node.try, node.catch, node.finally];
    }
    // Effect //
    case "ConditionalEffect": {
      return [node.condition, ...node.positive, ...node.negative];
    }
    case "WriteEffect": {
      return [node.right];
    }
    case "ExportEffect": {
      return [node.right];
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
    case "FunctionExpression": {
      return [node.body];
    }
    case "ArrowExpression": {
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
      return [node.condition, node.consequent, node.alternate];
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
      throw new AranTypeError("invalid node", node);
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
      return reduce(node.statements, accumulate, initial);
    }
    case "ClosureBlock": {
      return accumulate(
        reduce(node.statements, accumulate, initial),
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
      return accumulate(initial, node.do);
    }
    case "IfStatement": {
      return accumulate(
        accumulate(accumulate(initial, node.if), node.then),
        node.else,
      );
    }
    case "WhileStatement": {
      return accumulate(accumulate(initial, node.while), node.do);
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
        reduce(node.positive, accumulate, accumulate(initial, node.condition)),
      );
    }
    case "WriteEffect": {
      return accumulate(initial, node.right);
    }
    case "ExportEffect": {
      return accumulate(initial, node.right);
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
    case "FunctionExpression": {
      return accumulate(initial, node.body);
    }
    case "ArrowExpression": {
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
        accumulate(accumulate(initial, node.condition), node.consequent),
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
      throw new AranTypeError("invalid node", node);
    }
  }
};
