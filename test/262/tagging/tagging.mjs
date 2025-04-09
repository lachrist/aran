import { getFirst } from "../util/index.mjs";
import { loadTag } from "./load.mjs";

const { Set } = globalThis;

/**
 * @type {(
 *   specifier: import("../result.d.ts").TestSpecifier,
 * ) => import("../fetch.d.ts").TestPath}
 */
const getTestPath = (specifier) =>
  /** @type {import("../fetch.d.ts").TestPath} */ (specifier.split("@")[0]);

/**
 * @type {(
 *   tag: import("./tag.d.ts").Tag,
 * ) => Promise<(
 *   specifier: import("../result.d.ts").TestSpecifier,
 * ) => boolean>}
 */
export const loadTagging = async (tag) => {
  const set = new Set(await loadTag(tag));
  return (specifier) => set.has(specifier) || set.has(getTestPath(specifier));
};

/**
 * @template {import("./tag.d.ts").Tag} T
 * @param {T[]} tags
 * @returns {Promise<(
 *  specifier: import("../result.d.ts").TestSpecifier,
 * ) => T[]>}
 */
export const loadTaggingList = async (tags) => {
  /**
   * @type {[
   *   T,
   *   (specifier: import("../result.d.ts").TestSpecifier) => boolean,
   * ][]}
   */
  const entries = [];
  for (const tag of tags) {
    entries.push([tag, await loadTagging(tag)]);
  }
  return (specifier) =>
    entries.filter(([_tag, tagging]) => tagging(specifier)).map(getFirst);
};
