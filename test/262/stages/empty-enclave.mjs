import { parse } from "acorn";
import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { AranTypeError } from "../error.mjs";

/* eslint-disable local/strict-console */
const { String, Map, RegExp, Object, JSON, URL, console, setTimeout } =
  globalThis;
/* eslint-enable local/strict-console */

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

const common = {
  pointcut: /**
   * @type {import("../../../type/advice.js").Pointcut<
   *   import("./empty-enclave.d.ts").Location
   * >}
   */ (["eval.before"]),
  advice: /** @type {estree.Variable} */ ("__ARAN_ADVICE__"),
  intrinsic: /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__"),
  escape: /** @type {estree.Variable} */ ("__ARAN_ESCAPE__"),
  exec: /** @type {estree.Variable} */ ("__ARAN_EXEC__"),
  locate: /**
   * @type {import("../../../type/options.d.ts").Locate<
   *   import("./empty-enclave.d.ts").Location
   * >}
   */ ((path, base) => `${base}#${path}`),
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
  createInstrumenter: ({ warning }) => ({
    setup: [
      generate(
        setup({
          global: /** @type {estree.Variable} */ ("globalThis"),
          intrinsic: common.intrinsic,
          escape: common.escape,
          exec: common.exec,
        }),
      ),
      "var __ARAN_EXEC__ = $262.runScript;",
    ],
    globals: {
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
      __ARAN_ADVICE__: {
        __proto__: null,
        value: /** @type {import("./empty-enclave").Advice} */ ({
          "__proto__": null,
          "eval.before": (content1, context, location) => {
            const program1 = /** @type {estree.Program} */ (
              /** @type {unknown} */ (
                parse(String(content1), {
                  ecmaVersion: "latest",
                  sourceType: "script",
                  checkPrivateFields: false,
                })
              )
            );
            /**
             * @type {import("../../../type/options.d.ts").Options<
             *   import("./empty-enclave.d.ts").Location
             * >}
             */
            const options = {
              mode: null,
              situ: "local",
              plug: "reify",
              kind: "eval",
              base: /** @type {import("../../../type/options").Base} */ (
                location
              ),
              warning,
              context,
              error: "embed",
              ...common,
            };
            const program2 = instrument(program1, options);
            const content2 = generate(program2);
            return content2;
          },
        }),
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
      /**
       * @type {import("../../../type/options.d.ts").Options<
       *   import("./empty-enclave.d.ts").Location
       * >}
       */
      const options = {
        kind,
        context: null,
        mode: "sloppy",
        situ: "global",
        plug: "alien",
        base,
        warning,
        error: "throw",
        ...common,
      };
      const program2 = instrument(program1, options);
      const content2 = generate(program2);
      return {
        kind,
        url,
        content: content2,
      };
    },
  }),
};
