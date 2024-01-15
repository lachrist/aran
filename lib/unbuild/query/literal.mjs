import { hasNarrowObject } from "../../util/index.mjs";

/**
 * @type {(
 *   node: estree.Literal
 * ) => node is estree.BigIntLiteral}
 */
export const isBigIntLiteral = (node) =>
  hasNarrowObject(node, "bigint") && node.bigint != null;

/**
 * @type {(
 *   node: estree.Literal
 * ) => node is estree.RegExpLiteral}
 */
export const isRegExpLiteral = (node) =>
  hasNarrowObject(node, "regex") && node.regex != null;

/**
 * @type {(
 *   node: estree.Literal
 * ) => node is estree.RegExpLiteral}
 */
export const isSimpleLiteral = (node) =>
  !isRegExpLiteral(node) && !isBigIntLiteral(node);
