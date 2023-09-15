import { parseEstree } from "./parse.mjs";
import { formatEstree } from "./format.mjs";
import { convert } from "./convert.mjs";
import { revert } from "./revert.mjs";

/** @type {<V extends string, T>(node: aran.Node<V, T>) => string} */
export const format = (node) => formatEstree(revert(node));

/** @type {(code: string) => aran.Node<aran.Variable, {line: number, column: number}>} */
export const parse = (code) => convert(parseEstree(code));
