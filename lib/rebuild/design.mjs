import { isBinaryOperator, isUnaryOperator } from "../estree.mjs";
import { every } from "../util/index.mjs";

/**
 * @type {(
 *   node: import("./atom").Expression,
 * ) => node is import("./design").MemberDesign}
 */
export const isMemberDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.get" &&
  node.this.type === "PrimitiveExpression" &&
  node.arguments.length === 2;

/**
 * @type {(
 *   node: import("./atom").Expression,
 * ) => node is import("./design").PairDesign<
 *   import("./atom").Expression,
 *   import("./atom").Expression
 * >}
 */
export const isPairDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "Array.of" &&
  node.this.type === "PrimitiveExpression" &&
  node.arguments.length === 2;

/**
 * @type {<X extends import("./atom").Expression>(
 *   node: import("./atom").Expression,
 *   predicate: (node: import("./atom").Expression) => node is X,
 * ) => node is import("./design").ListDesign<X>}
 */
export const isListDesign = (node, predicate) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "Array.of" &&
  node.this.type === "PrimitiveExpression" &&
  every(node.arguments, predicate);

/**
 * @type {(
 *   node: import("./atom").Expression,
 * ) => node is import("./design").ArrayDesign}
 */
export const isArrayDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "Array.of" &&
  node.this.type === "PrimitiveExpression";

/**
 * @type {(
 *   node: import("./atom").Expression,
 * ) => node is import("./design").ObjectDesign}
 */
export const isObjectDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.createObject" &&
  node.this.type === "PrimitiveExpression" &&
  node.arguments.length > 1;

/**
 * @type {(
 *   node: import("./atom").Expression,
 * ) => node is import("./design").UnaryDesign}
 */
export const isUnaryDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.unary" &&
  node.this.type === "PrimitiveExpression" &&
  node.arguments.length === 2 &&
  node.arguments[0].type === "PrimitiveExpression" &&
  typeof node.arguments[0].primitive === "string" &&
  isUnaryOperator(node.arguments[0].primitive);

/**
 * @type {(
 *   node: import("./atom").Expression,
 * ) => node is import("./design").BinaryDesign}
 */
export const isBinaryDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.binary" &&
  node.this.type === "PrimitiveExpression" &&
  node.arguments.length === 3 &&
  node.arguments[0].type === "PrimitiveExpression" &&
  typeof node.arguments[0].primitive === "string" &&
  isBinaryOperator(node.arguments[0].primitive);
