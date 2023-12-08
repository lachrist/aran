import { generateSetup } from "./setup.mjs";
import { generate } from "astring";

// eslint-disable-next-line no-console
console.log(
  generate(
    generateSetup({
      global: /** @type {estree.Variable} */ ("globalThis"),
      intrinsic: /** @type {estree.Variable} */ ("_ARAN_INTRINSIC_"),
      escape: /** @type {estree.Variable} */ ("_ARAN_"),
      exec: /** @type {estree.Variable} */ ("runInThisContext"),
    }),
  ),
);
