import { readFile } from "node:fs/promises";
const { Map, undefined } = globalThis;

/** @type {Map<string, string>} */
const cache = new Map();

/**
 * @type {(url: URL) => Promise<string>}
 */
export const readFileCache = async (url) => {
  let content = cache.get(url.href);
  if (content === undefined) {
    content = await readFile(url, "utf8");
    cache.set(url.href, content);
  }
  return content;
};
