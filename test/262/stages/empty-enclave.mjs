import { parse } from "acorn";
import { generate } from "astring";
import { format } from "../format.mjs";
import { instrumentRaw, setupRaw } from "../../../lib/index.mjs";

const { Error, SyntaxError } = globalThis;

const INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

/** @type {test262.Stage} */
export default {
  requirements: ["identity", "parsing"],
  filtering: [],
  makeInstrumenter: (errors) => ({
    setup: generate(
      setupRaw({
        intrinsic: INTRINSIC,
        global: /** @type {estree.Variable} */ ("globalThis"),
      }),
    ),
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
      const { root: program2, logs } = instrumentRaw(program1, {
        kind,
        strict: false,
        context: null,
        pointcut: [],
        advice: {
          kind: "object",
          variable: /** @type {estree.Variable} */ ("__DUMMY__"),
        },
        intrinsic: INTRINSIC,
        escape: /** @type {estree.Variable} */ ("__ARAN_ESCAPE__"),
        locate: (path, root) => `${root}.${path}`,
        site: "global",
        enclave: true,
        root: /** @type {import("../../../type/options").Root} */ (
          typeof specifier === "number"
            ? `dynamic#${specifier}`
            : specifier.href
        ),
      });
      for (const log of logs) {
        if (log.name === "SyntaxError") {
          throw new SyntaxError(log.message);
        }
        errors.push({
          type: "instrumentation",
          name: log.name,
          message: log.message,
        });
      }
      const code2 = generate(program2);
      const code3 = format(code2);
      return code3;
    },
  }),
};
