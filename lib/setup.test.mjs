import { setupile } from "./setup.mjs";
import { generate } from "astring";

// eslint-disable-next-line no-console
console.log(
  generate(
    setupile({
      global_object_variable:
        /** @type {import("estree-sentry").VariableName} */ ("globalThis"),
      intrinsic_global_variable:
        /** @type {import("estree-sentry").VariableName} */ (
          "_ARAN_INTRINSIC_"
        ),
    }),
  ),
);
