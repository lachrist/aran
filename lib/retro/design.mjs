import { BINARY_OPERATOR_RECORD, UNARY_OPERATOR_RECORD } from "estree-sentry";
import { everyNarrow } from "../util/index.mjs";

const {
  Object: { hasOwn },
} = globalThis;

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 * ) => node is import("./design.d.ts").MemberDesign}
 */
export const isMemberDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.getValueProperty" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression") &&
  node.arguments.length === 2;

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 * ) => node is import("./design.d.ts").PairDesign<
 *   import("./atom.d.ts").Expression,
 *   import("./atom.d.ts").Expression
 * >}
 */
export const isPairDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "Array.of" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression") &&
  node.arguments.length === 2;

/**
 * @type {<X extends import("./atom.d.ts").Expression>(
 *   node: import("./atom.d.ts").Expression,
 *   predicate: (node: import("./atom.d.ts").Expression) => node is X,
 * ) => node is import("./design.d.ts").ListDesign<X>}
 */
export const isListDesign = (node, predicate) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "Array.of" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression") &&
  everyNarrow(node.arguments, predicate);

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 * ) => node is import("./design.d.ts").ArrayDesign}
 */
export const isArrayDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "Array.of" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression");

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 * ) => node is import("./design.d.ts").ObjectDesign}
 */
export const isObjectDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.createObject" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression") &&
  node.arguments.length > 1;

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 * ) => node is import("./design.d.ts").UnaryDesign}
 */
export const isUnaryDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.performUnaryOperation" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression") &&
  node.arguments.length === 2 &&
  node.arguments[0].type === "PrimitiveExpression" &&
  typeof node.arguments[0].primitive === "string" &&
  hasOwn(UNARY_OPERATOR_RECORD, node.arguments[0].primitive);

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 * ) => node is import("./design.d.ts").BinaryDesign}
 */
export const isBinaryDesign = (node) =>
  node.type === "ApplyExpression" &&
  node.callee.type === "IntrinsicExpression" &&
  node.callee.intrinsic === "aran.performBinaryOperation" &&
  (node.this.type === "PrimitiveExpression" ||
    node.this.type === "IntrinsicExpression") &&
  node.arguments.length === 3 &&
  node.arguments[0].type === "PrimitiveExpression" &&
  typeof node.arguments[0].primitive === "string" &&
  hasOwn(BINARY_OPERATOR_RECORD, node.arguments[0].primitive);
