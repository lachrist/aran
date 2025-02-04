import { readFile } from "node:fs/promises";
import { AranExecError } from "./error.mjs";

const { Map, URL } = globalThis;

/**
 * @type {import("./fetch").ResolveDependency}
 */
export const resolveDependency = (name, base) =>
  /** @type {import("./fetch").DependencyPath} */ (
    new URL(name, new URL(base, "dummy:///")).pathname.slice(1)
  );

/**
 * @type {(
 *   home: URL,
 * ) => import("./fetch").FetchHarness}
 */
export const compileFetchHarness = (home) => {
  /**
   * @type {Map<import("./fetch").HarnessName, string>}
   */
  const cache = new Map();
  return async (name) => {
    if (cache.has(name)) {
      return /** @type {string} */ (cache.get(name));
    } else {
      const content = await readFile(new URL(`harness/${name}`, home), "utf-8");
      cache.set(name, content);
      return content;
    }
  };
};

/**
 * @type {(
 *   home: URL,
 * ) => import("./fetch").FetchTarget}
 */
export const compileFetchTarget = (home) => (path) =>
  readFile(new URL(`test/${path}`, home), "utf-8");

/**
 * @type {(
 *   url: URL,
 *   home: URL,
 * ) => null | import("./fetch").TestPath}
 */
export const toTestPath = (url, home) => {
  const base = new URL("test/", home);
  if (url.href.startsWith(base.href)) {
    const path = url.pathname.slice(base.pathname.length);
    if (path.includes("_FIXTURE") || path.endsWith(".md")) {
      return null;
    } else {
      return /** @type {import("./fetch").TestPath} */ (path);
    }
  } else {
    throw new AranExecError("Not relative url from home", {
      url: url.href,
      home: home.href,
    });
  }
};
