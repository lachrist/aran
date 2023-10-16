import { parse } from "acorn";
import { generate } from "astring";
import { format } from "../format.mjs";
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
    instrument: (code1, { kind, specifier }) => {
      const program1 = /** @type {estree.Program} */ (
        /** @type {unknown} */ (
          parse(code1, { ecmaVersion: "latest", sourceType: kind })
        )
      );
      const program2 = instrument(program1, {
        kind,
        root: /** @type {import("../../../type/options").Root} */ (
          typeof specifier === "number"
            ? `dynamic#${specifier}`
            : specifier.href
        ),
      });
      const code2 = generate(program2);
      console.dir(program2, { depth: null });
      const code3 = format(code2);
      console.log(code3);
      return code3;
    },
  },
  filtering: [],
};
