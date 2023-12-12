import { parseEstree } from "./parse.mjs";
import { formatEstree } from "./format.mjs";
import { convert } from "./convert.mjs";
import { revert } from "./revert.mjs";

/** @type {(code: string) => aran.Node<convert.Atom>} */
export const parse = (code) => convert(parseEstree(code));

/** @type {<A extends aran.Atom>(node: aran.Node<A>) => string} */
export const format = (node) =>
  formatEstree(revert(/** @type {aran.Node<revert.Atom>} */ (node)));
