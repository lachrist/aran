import { parse } from "acorn";
import { generate } from "astring";

/** @type {import("../../instrument.js").Instrument} */
export default ({ code, kind }) =>
  generate(parse(code, { sourceType: kind, ecmaVersion: 2024 }));
