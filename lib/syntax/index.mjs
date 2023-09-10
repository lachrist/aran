import { parseEstree } from "./parse.mjs";
import { formatEstree } from "./format.mjs";
import { convert } from "./convert.mjs";
import { revert } from "./revert.mjs";

/** @type {(node: Node<unknown>) => string} */
export const format = (node) => formatEstree(revert(node));

/** @type {(code: string) => Node<{line: number, column: number}>} */
export const parse = (code) => convert(parseEstree(code));
