import { parse } from "acorn";
import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { AranTypeError } from "../error.mjs";

// eslint-disable-next-line local/strict-console
const { Reflect, Map, RegExp, Object, JSON, URL, console, Error, setTimeout } =
  globalThis;

/**
 * @type {(
 *   item: unknown,
 * ) => item is {
 *   pattern: string,
 *   flaky: boolean,
 * }}
 */
const isPatternMatcherItem = (item) =>
  typeof item === "object" &&
  item !== null &&
  "pattern" in item &&
  Object.hasOwn(item, "pattern") &&
  typeof item.pattern === "string" &&
  "flaky" in item &&
  Object.hasOwn(item, "flaky") &&
  typeof item.flaky === "boolean";

/**
 * @type {(
 *   item: unknown,
 * ) => item is {
 *   exact: string,
 *   flaky: boolean,
 * }}
 */
const isExactMatcherItem = (item) =>
  typeof item === "object" &&
  item !== null &&
  "exact" in item &&
  Object.hasOwn(item, "exact") &&
  typeof item.exact === "string" &&
  "flaky" in item &&
  Object.hasOwn(item, "flaky") &&
  typeof item.flaky === "boolean";

/**
 * @type {(
 *   matchers: import("./empty-enclave.d.ts").Matcher,
 * ) => (
 *   result: import("../types.js").Result,
 * ) => boolean}
 */
const compileMatcher = (items) => {
  /** @type {Map<string, boolean>} */
  const singletons = new Map();
  /** @type {[RegExp, boolean][]} */
  const groups = [];
  for (const item of items) {
    if (typeof item === "string") {
      singletons.set(item, false);
    } else if (isExactMatcherItem(item)) {
      singletons.set(item.exact, item.flaky);
    } else if (isPatternMatcherItem(item)) {
      groups.push([new RegExp(item.pattern, "u"), item.flaky]);
    } else {
      throw new AranTypeError("invalid item", item);
    }
  }
  return ({ target, error }) => {
    if (singletons.has(target)) {
      return singletons.get(target) ? error !== null : true;
    }
    for (const [group, flaky] of groups) {
      if (group.test(target)) {
        return flaky ? error !== null : true;
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
 * ) => [
 *   string,
 *   (result: import("../types.js").Result) => boolean,
 * ]}
 */
const compileMatcherEntry = ([tag, items]) => [tag, compileMatcher(items)];

/**
 * @type {(
 *   category: {
 *     [key in string]: import("./empty-enclave.d.ts").MatcherItem[]
 *   },
 * ) => (
 *   result: import("../types.js").Result,
 * ) => string[]}
 */
const compileTagging = (category) => {
  const matchers = Object.entries(category).map(compileMatcherEntry);
  return (result) => {
    const tags = [];
    for (const [tag, matcher] of matchers) {
      if (matcher(result)) {
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
  expect: (result) => [
    ...(result.error !== null && result.error.name === "EvalAranError"
      ? ["eval-limitation"]
      : []),
    ...tagging(result),
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
