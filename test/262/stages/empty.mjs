import { parse } from "acorn";
import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";

const { Error } = globalThis;

/** @type {test262.Stage} */
export default {
  requirements: ["identity", "parsing"],
  instrumenter: {
    setup: generate(setup()),
    globals: [
      [
        "eval",
        () => {
          throw new Error("eval is not supported");
        },
      ],
    ],
    instrument: (code, kind) =>
      generate(
        instrument(
          /** @type {estree.Program} */ (
            /** @type {unknown} */ (
              parse(code, { ecmaVersion: "latest", sourceType: kind })
            )
          ),
          {
            kind,
          },
        ),
      ),
  },
  filtering: [],
};
