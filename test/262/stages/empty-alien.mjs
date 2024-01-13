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
 *   matchers: import("./empty-alien").Matcher,
 * ) => (
 *   result: import("../types").Result,
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
 *     import("./empty-alien").Matcher,
 *   ],
 * ) => [
 *   string,
 *   (result: import("../types").Result) => boolean,
 * ]}
 */
const compileMatcherEntry = ([tag, items]) => [tag, compileMatcher(items)];

/**
 * @type {(
 *   category: {
 *     [key in string]: import("./empty-alien").MatcherItem[]
 *   },
 * ) => (
 *   result: import("../types").Result,
 * ) => string[]}
 */
const compileExpect = (category) => {
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

const GLOBAL = /** @type {estree.Variable} */ ("globalThis");

const INTRINSIC = /** @type {estree.Variable} */ ("_ARAN_INTRINSIC_");

/**
 * @type {import("../../../lib/config").Config<
 *   import("./empty-alien").Base,
 *   import("./empty-alien").Location
 * >}
 */
const config = {
  global: GLOBAL,
  pointcut: ["eval.before"],
  advice: /** @type {estree.Variable} */ ("_ARAN_ADVICE_"),
  intrinsic: null,
  escape: /** @type {estree.Variable} */ ("_ARAN_ESCAPE_"),
  locate: (path, base) =>
    /** @type {import("./empty-alien").Location} */ (`${base}#${path}`),
};

/**
 * @type {(
 *   guard: boolean,
 *   root: estree.Program & {
 *     warnings: import("../../../lib/unbuild/warning").Warning[],
 *   },
 * ) => estree.Program}
 */
const warn = (guard, root) => {
  if (guard) {
    for (const warning of root.warnings) {
      console.warn(warning);
    }
  }
  return root;
};

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("empty-alien.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  createInstrumenter: ({ record, warning }) => {
    let counter = 0;
    return {
      setup: [
        generate(
          setup({
            global: GLOBAL,
            intrinsic: INTRINSIC,
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
        _ARAN_ADVICE_: {
          __proto__: null,
          value: /** @type {import("./empty-alien").Advice} */ ({
            "__proto__": null,
            "eval.before": (content1, context, location) => {
              counter += 1;
              const { content } = record({
                kind: "script",
                url: new URL(`eval:///${counter}`),
                content: generate(
                  warn(
                    warning === "console",
                    instrument(
                      {
                        root: /** @type {estree.Program} */ (
                          /** @type {unknown} */ (
                            parse(String(content1), {
                              ecmaVersion: "latest",
                              sourceType: "script",
                              checkPrivateFields: false,
                            })
                          )
                        ),
                        base: /** @type {import("./empty-alien").Base} */ (
                          /** @type {string} */ (location)
                        ),
                      },
                      context,
                      config,
                    ),
                  ),
                ),
              });
              return content;
            },
          }),
          writable: false,
          enumerable: false,
          configurable: false,
        },
      },
      instrument: ({ kind, url, content: content1 }) =>
        record({
          kind,
          url,
          content: generate(
            warn(
              warning === "console",
              instrument(
                {
                  root: /** @type {estree.Program} */ (
                    /** @type {unknown} */ (
                      parse(content1, {
                        ecmaVersion: "latest",
                        sourceType: kind,
                      })
                    )
                  ),
                  base: /** @type {import("./empty-alien").Base} */ (
                    url.protocol === "file:"
                      ? relative(cwd(), fileURLToPath(url))
                      : url.href
                  ),
                },
                { source: kind, mode: "sloppy", scope: "alien" },
                config,
              ),
            ),
          ),
        }),
    };
  },
};
