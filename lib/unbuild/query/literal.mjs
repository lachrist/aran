import { hasOwn } from "../../util/index.mjs";

/**
 * @type {(
 *   node: estree.Literal
 * ) => node is estree.BigIntLiteral}
 */
export const isBigIntLiteral = (node) =>
  hasOwn(node, "bigint") && /** @type {any} */ (node).bigint != null;

/**
 * @type {(
 *   node: estree.Literal
 * ) => node is estree.RegExpLiteral}
 */
export const isRegExpLiteral = (node) =>
  hasOwn(node, "regex") && /** @type {any} */ (node).regex != null;

/**
 * @type {(
 *   node: estree.Literal
 * ) => node is estree.RegExpLiteral}
 */
export const isSimpleLiteral = (node) =>
  !isRegExpLiteral(node) && !isBigIntLiteral(node);
