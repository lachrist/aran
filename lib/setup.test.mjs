import { generateSetup } from "./setup.mjs";
import { generate } from "astring";

// eslint-disable-next-line no-console
console.log(
  generate(
    generateSetup({
      global_object_variable:
        /** @type {import("estree-sentry").VariableName} */ ("globalThis"),
      intrinsic_global_variable:
        /** @type {import("./global_property_key").GlobalPropertyKey} */ (
          "_ARAN_INTRINSIC_"
        ),
    }),
  ),
);
