import { parse } from "acorn";
import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { inverse } from "../util.mjs";
import { readFile } from "node:fs/promises";

// eslint-disable-next-line local/strict-console
const { Reflect, Map, Object, JSON, URL, console, Error } = globalThis;

/** @type {Map<string, string[]>} */
const tagging = inverse(
  new Map(
    Object.entries(
      JSON.parse(
        await readFile(
          new URL("empty-enclave.manual.json", import.meta.url),
          "utf8",
        ),
      ),
    ),
  ),
);

const INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

// eslint-disable-next-line local/no-class, local/standard-declaration
class EvalAranError extends Error {}

const makeEvalPlaceholder = () => {
  const evalPlaceholder = () => {
    console.log("eval is not supported");
    throw new EvalAranError("eval is not supported");
  };
  Reflect.defineProperty(evalPlaceholder, "length", {
    // @ts-ignore
    __proto__: null,
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  Reflect.defineProperty(evalPlaceholder, "name", {
    // @ts-ignore
    __proto__: null,
    value: "eval",
    writable: false,
    enumerable: false,
    configurable: true,
  });
  return evalPlaceholder;
};

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  tagFailure: ({ target, error }) => [
    ...(error.name === "EvalAranError" ? ["eval-limitation"] : []),
    ...(tagging.get(target) ?? []),
  ],
  instrumenter: {
    setup: generate(
      setup({
        intrinsic: INTRINSIC,
        global: /** @type {estree.Variable} */ ("globalThis"),
      }),
    ),
    listGlobal: () => ({
      eval: {
        // @ts-ignore
        __proto__: null,
        value: makeEvalPlaceholder(),
        writable: true,
        enumerable: false,
        configurable: true,
      },
      ARAN: {
        __proto__: null,
        value: (/** @type {unknown} */ value) => console.dir(value),
        writable: false,
        enumerable: false,
        configurable: false,
      },
    }),
    instrument: ({ kind, url, content: content1 }) => {
      const program1 = /** @type {estree.Program} */ (
        /** @type {unknown} */ (
          parse(content1, {
            ecmaVersion: "latest",
            sourceType: kind,
          })
        )
      );
      const base = /** @type {import("../../../type/options").Base} */ (
        url.href
      );
      const program2 = instrument(
        program1,
        // make sure we defined all options
        /** @type {import("../../../type/options.d.ts").Options<string>} */ ({
          kind,
          situ: "global",
          plug: "alien",
          mode: "sloppy",
          context: null,
          pointcut: [],
          advice: /** @type {estree.Variable} */ ("__ARAN_ADVICE__"),
          intrinsic: INTRINSIC,
          escape: /** @type {estree.Variable} */ ("__ARAN_ESCAPE__"),
          locate: (path, base) => `${base}#${path}`,
          base,
          error: "throw",
          warning: "silent",
        }),
      );
      const content2 = generate(program2);
      return {
        kind,
        url,
        content: content2,
      };
    },
  },
};
