import { hasOwn } from "../util/index.mjs";

/** @type {(node: estree.Literal) => node is estree.RegExpLiteral} */
export const isRegExpLiteral = (node) => hasOwn(node, "regex");

/** @type {(node: estree.Literal) => node is estree.BigIntLiteral} */
export const isBigIntLiteral = (node) => hasOwn(node, "regex");
