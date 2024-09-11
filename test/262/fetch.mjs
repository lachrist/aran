import { readFile } from "node:fs/promises";

const { Map, URL } = globalThis;

/**
 * @type {(
 *   name: import("./fetch").TargetName,
 *   base: import("./fetch").TargetPath,
 * ) => import("./fetch").TargetPath}
 */
export const resolveTarget = (name, base) =>
  /** @type {import("./fetch").TargetPath} */ (`${base}/${name}`);

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
      const content = await readFile(new URL(`harness/${name}`, home), "utf8");
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
  readFile(new URL(path, home), "utf8");

/**
 * @type {(
 *   url: URL,
 *   home: URL,
 * ) => null | import("./fetch").TargetPath}
 */
export const toTargetPath = (url, home) => {
  const path = url.pathname.slice(home.pathname.length + 1);
  if (path.includes("_FIXTURE") || path.endsWith(".md")) {
    return null;
  } else {
    return /** @type {import("./fetch").TargetPath} */ (path);
  }
};
