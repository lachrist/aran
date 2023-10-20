import { parse } from "acorn";
import { generate } from "astring";
import { instrumentRaw, setupRaw } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { listDumpFailure } from "../result.mjs";
import { AranError } from "../error.mjs";

// eslint-disable-next-line local/strict-console
const { console, Error, Object, JSON, Set, URL, SyntaxError } = globalThis;

const INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

// eslint-disable-next-line local/no-class, local/standard-declaration
class AranEvalError extends Error {}

/** @type {(entry: [string, string[]]) => [string, Set<string>]} */
const compileExclusion = ([name, targets]) => [name, new Set(targets)];

/** @type {(target: string, exclusion: [string, Set<string>]) => string[]} */
const listTag = (target, [name, selection]) =>
  selection.has(target) ? [name] : [];

/** @type {[string, Set<string>][]} */
const exclusions = [
  /** @type {[string, string[]]} */ ([
    "identity",
    listDumpFailure(
      await readFile(new URL("identity.jsonlist", import.meta.url), "utf8"),
    ),
  ]),
  /** @type {[string, string[]]} */ ([
    "parsing",
    listDumpFailure(
      await readFile(new URL("parsing.jsonlist", import.meta.url), "utf8"),
    ),
  ]),
  .../** @type {[string, string[]][]} */ (
    Object.entries(
      JSON.parse(
        await readFile(
          new URL("./empty-enclave-tagging.json", import.meta.url),
          "utf8",
        ),
      ),
    )
  ),
].map(compileExclusion);

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
  tagResult: ({ target, error }) => [
    ...(error !== null && error.name === "AranEvalError"
      ? ["AranEvalError"]
      : []),
    ...exclusions.flatMap((exclusion) => listTag(target, exclusion)),
  ],
  makeInstrumenter: (trace) => ({
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
          throw new AranEvalError("eval is not supported");
        },
      ],
      ["ARAN", (/** @type {unknown} */ value) => console.dir(value)],
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
        } else if (log.name === "ClashError") {
          throw new AranError(log.message);
        } else {
          trace.push({
            name: "InstrumenterWarning",
            message: log.name,
          });
        }
      }
      const code2 = generate(program2);
      return code2;
    },
  }),
};
