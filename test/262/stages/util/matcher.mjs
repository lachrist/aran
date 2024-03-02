import { AranTypeError } from "../../error.mjs";

const { RegExp, Object, Map } = globalThis;

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
 *   matchers: import("./matcher").Matcher,
 * ) => (
 *   result: import("../../types").Result,
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
 *     import("./matcher").Matcher,
 *   ],
 * ) => [
 *   string,
 *   (result: import("../../types").Result) => boolean,
 * ]}
 */
const compileMatcherEntry = ([tag, items]) => [tag, compileMatcher(items)];

/**
 * @type {(
 *   category: {
 *     [key in string]: import("./matcher").MatcherItem[]
 *   },
 * ) => (
 *   result: import("../../types").Result,
 * ) => string[]}
 */
export const compileExpect = (category) => {
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
