import { parse } from "acorn";
import { generate } from "astring";
import { instrumentRaw, setupRaw } from "../../../lib/index.mjs";
import { inverse } from "../util.mjs";
import { readFile } from "node:fs/promises";

// eslint-disable-next-line local/strict-console
const { Proxy, Reflect, Map, Object, JSON, URL, console, Error, SyntaxError } =
  globalThis;

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

// eslint-disable-next-line local/no-class, local/standard-declaration
class ClashAranError extends Error {}

const evalTarget = () => {
  throw new EvalAranError("eval is not supported");
};

Reflect.defineProperty(evalTarget, "length", {
  // @ts-ignore
  __proto__: null,
  value: 1,
  writable: false,
  enumerable: false,
  configurable: true,
});

Reflect.defineProperty(evalTarget, "name", {
  // @ts-ignore
  __proto__: null,
  value: "eval",
  writable: false,
  enumerable: false,
  configurable: true,
});

const throwImmutableEval = () => {
  throw new EvalAranError("eval is immutable");
};

const evalProxy = new Proxy(evalTarget, {
  // @ts-ignore
  __proto__: null,
  set: throwImmutableEval,
  defineProperty: throwImmutableEval,
  deleteProperty: throwImmutableEval,
  preventExtensions: throwImmutableEval,
  setPrototypeOf: throwImmutableEval,
});

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  tagFailure: ({ target, error }) => [
    ...(error.name === "EvalAranError" ? ["eval-limitation"] : []),
    ...(tagging.get(target) ?? []),
  ],
  instrumenter: {
    setup: generate(
      setupRaw({
        intrinsic: INTRINSIC,
        global: /** @type {estree.Variable} */ ("globalThis"),
      }),
    ),
    globals: [
      ["eval", evalProxy],
      ["ARAN", (/** @type {unknown} */ value) => console.dir(value)],
    ],
    instrument: ({ kind, url, content: content1 }) => {
      const program1 = /** @type {estree.Program} */ (
        /** @type {unknown} */ (
          parse(content1, {
            ecmaVersion: "latest",
            sourceType: kind,
          })
        )
      );
      const root = /** @type {import("../../../type/options").Root} */ (
        url.href
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
          throw new ClashAranError(log.message);
        }
      }
      const content2 = generate(program2);
      return {
        kind,
        url,
        content: content2,
      };
    },
  },
};
