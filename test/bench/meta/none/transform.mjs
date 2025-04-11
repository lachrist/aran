import { parse } from "acorn";
import { generate } from "astring";

/** @type {import("../../transform.d.ts").Transform} */
export default {
  transformBase: ({ code, kind }) =>
    generate(parse(code, { sourceType: kind, ecmaVersion: 2020 })),
  transformMeta: ({ code, kind }) =>
    generate(parse(code, { sourceType: kind, ecmaVersion: 2020 })),
};
