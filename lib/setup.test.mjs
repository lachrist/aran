import { generateSetup } from "./setup.mjs";
import { generate } from "astring";

// eslint-disable-next-line no-console
console.log(
  generate(
    generateSetup({
      global_variable: /** @type {estree.Variable} */ ("globalThis"),
      intrinsic_variable: /** @type {estree.Variable} */ ("_ARAN_INTRINSIC_"),
    }),
  ),
);
