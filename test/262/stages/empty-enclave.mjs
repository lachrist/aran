import { parse } from "acorn";
import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { AranTypeError } from "../error.mjs";

// eslint-disable-next-line local/strict-console
const { Reflect, Set, RegExp, Object, JSON, URL, console, Error, setTimeout } =
  globalThis;

/**
 * @type {(
 *   item: unknown,
 * ) => item is import("./empty-enclave.d.ts").MatcherItem & {}}
 */
const isPatternMatcherItem = (item) =>
  typeof item === "object" &&
  item !== null &&
  "pattern" in item &&
  Object.hasOwn(item, "pattern") &&
  typeof item.pattern === "string";

/**
 * @type {(
 *   matchers: import("./empty-enclave.d.ts").Matcher,
 * ) => (
 *   target: string
 * ) => boolean}
 */
const compileMatcher = (items) => {
  /** @type {Set<string>} */
  const singletons = new Set();
  /** @type {RegExp[]} */
  const groups = [];
  for (const item of items) {
    if (typeof item === "string") {
      singletons.add(item);
    } else if (isPatternMatcherItem(item)) {
      groups.push(new RegExp(item.pattern, "u"));
    } else {
      throw new AranTypeError("invalid item", item);
    }
  }
  return (target) => {
    if (singletons.has(target)) {
      return true;
    }
    for (const group of groups) {
      if (group.test(target)) {
        return true;
      }
    }
    return false;
  };
};

/**
 * @type {(
 *   entry: [
 *     string,
 *     import("./empty-enclave.d.ts").Matcher,
 *   ],
 * ) => [string, (target: string) => boolean]}
 */
const compileMatcherEntry = ([tag, items]) => [tag, compileMatcher(items)];

/**
 * @type {(
 *   category: {
 *     [key in string]: import("./empty-enclave.d.ts").MatcherItem[]
 *   },
 * ) => (
 *   target: string,
 * ) => string[]}
 */
const compileTagging = (category) => {
  const matchers = Object.entries(category).map(compileMatcherEntry);
  return (target) => {
    const tags = [];
    for (const [tag, matcher] of matchers) {
      if (matcher(target)) {
        tags.push(tag);
      }
    }
    return tags;
  };
};

const tagging = compileTagging(
  JSON.parse(
    await readFile(
      new URL("empty-enclave.manual.json", import.meta.url),
      "utf8",
    ),
  ),
);

const INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

// eslint-disable-next-line local/no-class, local/standard-declaration
class EvalAranError extends Error {}

/**
 * @type {(
 *   reject: (error: Error) => void,
 * ) => function}
 */
const makeEvalPlaceholder = (reject) => {
  const evalPlaceholder = () => {
    const error = new EvalAranError("eval is not supported");
    reject(error);
    throw error;
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
  exclusion: [],
  tagFailure: ({ target, error }) => [
    ...(error.name === "EvalAranError" ? ["eval-limitation"] : []),
    ...tagging(target),
  ],
  createInstrumenter: ({ reject, warning }) => ({
    setup: generate(
      setup({
        intrinsic: INTRINSIC,
        global: /** @type {estree.Variable} */ ("globalThis"),
      }),
    ),
    globals: {
      eval: {
        // @ts-ignore
        __proto__: null,
        value: makeEvalPlaceholder(reject),
        writable: true,
        enumerable: false,
        configurable: true,
      },
      ARAN: {
        __proto__: null,
        value: (/** @type {unknown} */ value) =>
          console.dir(value, { showHidden: true }),
        writable: false,
        enumerable: false,
        configurable: false,
      },
      ARAN_SET_TIMEOUT: {
        __proto__: null,
        value: setTimeout,
        writable: false,
        enumerable: false,
        configurable: false,
      },
    },
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
        url.protocol === "file:"
          ? relative(cwd(), fileURLToPath(url))
          : url.href
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
          warning,
        }),
      );
      const content2 = generate(program2);
      return {
        kind,
        url,
        content: content2,
      };
    },
  }),
};
