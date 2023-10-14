import { readFile } from "node:fs/promises";
import { runInContext } from "node:vm";
import { inspectError } from "./inspect.mjs";

const { Map, Error, undefined } = globalThis;

/** @type {Map<string, string>} */
const cache = new Map();

/**
 * @type {(
 *   url: URL,
 * ) => Promise<test262.Outcome<string,test262.Error>>}
 */
const readFileCache = async (url) => {
  let content = cache.get(url.href);
  if (content === undefined) {
    try {
      content = await readFile(url, "utf8");
    } catch (error) {
      return {
        type: "failure",
        error: {
          type: "harness",
          name: /** @type {Error} */ (error).name,
          message: /** @type {Error} */ (error).message,
        },
      };
    }
    cache.set(url.href, content);
  }
  return {
    type: "success",
    value: content,
  };
};

/**
 * @type {(
 *   url: URL,
 *   context: object,
 * ) => Promise<test262.Outcome<null, test262.Error>>}
 */
export const runHarness = async (url, context) => {
  const outcome = await readFileCache(url);
  switch (outcome.type) {
    case "failure":
      return outcome;
    case "success":
      try {
        runInContext(outcome.value, context, { filename: url.href });
      } catch (error) {
        return {
          type: "failure",
          error: inspectError("harness", error),
        };
      }
      return { type: "success", value: null };
    default:
      throw new Error("invalid outcome");
  }
};
