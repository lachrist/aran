import { generateSetup } from "./setup.mjs";
import { generate } from "astring";

// eslint-disable-next-line no-console
console.log(
  generate(
    generateSetup({
      global_variable: /** @type {import("estree-sentry").VariableName} */ (
        "globalThis"
      ),
      intrinsic_variable: /** @type {import("estree-sentry").VariableName} */ (
        "_ARAN_INTRINSIC_"
      ),
    }),
  ),
);
