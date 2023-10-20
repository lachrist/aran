import { parse } from "acorn";
import { generate } from "astring";
import { instrumentRaw, setupRaw } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { listDumpFailure } from "../result.mjs";

const { Object, JSON, Set, URL, Error, SyntaxError } = globalThis;

const INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

// console.log(
//   JSON.stringify(
//     listDumpFailure(
//       await readFile(
//         new URL("empty-enclave.jsonlist", import.meta.url),
//         "utf8",
//       ),
//     ),
//   ),
// );

/** @type {test262.Stage} */
export default {
  exclusion: [
    ...listDumpFailure(
      await readFile(new URL("identity.jsonlist", import.meta.url), "utf8"),
    ),
    ...listDumpFailure(
      await readFile(new URL("parsing.jsonlist", import.meta.url), "utf8"),
    ),
  ],
  filtering: /** @type {[string, string[]][]} */ (
    Object.entries(
      JSON.parse(
        await readFile(
          new URL("./empty-enclave-filtering.json", import.meta.url),
          "utf8",
        ),
      ),
    )
  ).map(([name, targets]) => {
    const selection = new Set(targets);
    return [name, ({ target }) => selection.has(target)];
  }),
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
          errors.push({
            type: "instrumentation",
            severity: "suppress",
            name: "EvalLimitation",
            message: "eval is not supported",
          });
          throw new Error("eval is not supported");
        },
      ],
      ["ARAN", (/** @type {unknown}| */ value) => console.dir(value)],
    ],
    instrument: (code1, { kind, specifier }) => {
      const program1 = /** @type {estree.Program} */ (
        /** @type {unknown} */ (
          parse(code1, { ecmaVersion: "latest", sourceType: kind })
        )
      );
      const root = /** @type {import("../../../type/options").Root} */ (
        typeof specifier === "number" ? `dynamic#${specifier}` : specifier.href
      );
      const { root: program2, logs } = instrumentRaw(program1, {
        kind,
        strict: false,
        context: null,
        pointcut: [],
        advice: {
          kind: "object",
          variable: /** @type {estree.Variable} */ ("__ARAN_ADVICE__"),
        },
        intrinsic: INTRINSIC,
        escape: /** @type {estree.Variable} */ ("__ARAN_ESCAPE__"),
        locate: (path, root) => `${root}.${path}`,
        site: "global",
        enclave: true,
        root,
      });
      for (const log of logs) {
        if (log.name === "SyntaxError") {
          throw new SyntaxError(log.message);
        }
        errors.push({
          type: "instrumentation",
          severity:
            log.name === "EnclaveLimitation" ||
            log.name === "BlockFunctionDeclaration"
              ? "warning"
              : "error",
          name: log.name,
          message: log.message,
        });
      }
      const code2 = generate(program2);
      return code2;
    },
  }),
};
