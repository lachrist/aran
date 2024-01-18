import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";
import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { AranTypeError } from "../error.mjs";
import { fromOutcome } from "../outcome.mjs";

/* eslint-disable local/strict-console */
const {
  String,
  Map,
  RegExp,
  Object,
  JSON,
  URL,
  console,
  setTimeout,
  SyntaxError,
} = globalThis;
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
      throw new AranTypeError(item);
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
  intrinsic: INTRINSIC,
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

/**
 * @type {(
 *   code: string,
 *   kind: "script" | "module" | "local-eval",
 * ) => import("../outcome").Outcome<estree.Program, string>}
 */
export const parse = (code, kind) => {
  if (kind === "local-eval") {
    try {
      return {
        type: "success",
        data: /** @type {estree.Program} */ (
          /** @type {unknown} */ (
            parseBabel(code, {
              allowImportExportEverywhere: false,
              allowAwaitOutsideFunction: false,
              // @ts-ignore
              allowNewTargetOutsideFunction: true,
              allowReturnOutsideFunction: false,
              allowSuperOutsideMethod: true,
              allowUndeclaredExports: false,
              attachComment: false,
              annexB: true,
              createImportExpressions: false,
              createParenthesizedExpressions: false,
              errorRecovery: false,
              plugins: ["estree"],
              sourceType: "script",
              strictMode: false,
              ranges: false,
              tokens: false,
            }).program
          )
        ),
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error instanceof SyntaxError
      ) {
        return {
          type: "failure",
          data: error.message,
        };
      } else {
        throw error;
      }
    }
  } else {
    try {
      return {
        type: "success",
        data: /** @type {estree.Program} */ (
          parseAcorn(code, {
            ecmaVersion: "latest",
            sourceType: kind,
            checkPrivateFields: false,
          })
        ),
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error instanceof SyntaxError
      ) {
        return {
          type: "failure",
          data: error.message,
        };
      } else {
        throw error;
      }
    }
  }
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
            "eval.before": (content, context, location) =>
              typeof content === "string"
                ? fromOutcome(
                    parse(String(content), "local-eval"),
                    (root) => {
                      counter += 1;
                      const { content } = record({
                        kind: "script",
                        url: new URL(`eval:///${counter}`),
                        content: generate(
                          warn(
                            warning === "console",
                            instrument(
                              {
                                root,
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
                    (message) =>
                      `throw new globalThis.SyntaxError(${JSON.stringify(
                        message,
                      )})`,
                  )
                : content,
          }),
          writable: false,
          enumerable: false,
          configurable: false,
        },
      },
      instrument: ({ kind, url, content }) =>
        fromOutcome(
          parse(content, kind),
          (root) =>
            record({
              kind,
              url,
              content: generate(
                warn(
                  warning === "console",
                  instrument(
                    {
                      root,
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
          (message) => {
            throw SyntaxError(message);
          },
        ),
    };
  },
};
