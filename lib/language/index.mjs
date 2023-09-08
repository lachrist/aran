import { parseBabel } from "./babel.mjs";
import { formatPrettier } from "./prettier.mjs";
import { convert } from "./convert.mjs";
import { revert } from "./revert.mjs";

/** @type {(node: Node<unknown>) => string} */
export const format = (node) => formatPrettier(revert(node));

/** @type {(code: string) => Node<{line: number, column: number}>} */
export const parse = (code) => convert(parseBabel(code));
