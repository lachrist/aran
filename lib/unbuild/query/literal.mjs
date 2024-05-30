import { hasNarrowObject } from "../../util/index.mjs";

/**
 * @type {(
 *   node: import("../../estree").Literal
 * ) => node is import("../../estree").BigIntLiteral}
 */
export const isBigIntLiteral = (node) =>
  hasNarrowObject(node, "bigint") && node.bigint != null;

/**
 * @type {(
 *   node: import("../../estree").Literal
 * ) => node is import("../../estree").RegExpLiteral}
 */
export const isRegExpLiteral = (node) =>
  hasNarrowObject(node, "regex") && node.regex != null;

/**
 * @type {(
 *   node: import("../../estree").Literal
 * ) => node is import("../../estree").RegExpLiteral}
 */
export const isSimpleLiteral = (node) =>
  !isRegExpLiteral(node) && !isBigIntLiteral(node);
