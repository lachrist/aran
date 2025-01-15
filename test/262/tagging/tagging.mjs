import { readFile } from "fs/promises";
import { getFirst, trimString } from "../util/index.mjs";

const { Set, URL } = globalThis;

/**
 * @type {(
 *   string: string,
 * ) => boolean}
 */
export const isNotEmptyLine = (string) =>
  string.length > 0 && string[0] !== "#";

/**
 * @type {(
 *   content: string,
 * ) => (
 *   specifier: import("../result").TestSpecifier,
 * ) => boolean}
 */
const compileTagging = (content) => {
  const set = new Set(
    content.split("\n").map(trimString).filter(isNotEmptyLine),
  );
  return (specifier) => set.has(specifier) || set.has(specifier.split("@")[0]);
};

/**
 * @type {(
 *   tag: import("./tag").Tag,
 * ) => Promise<(
 *   specifier: import("../result").TestSpecifier,
 * ) => boolean>}
 */
export const loadTagging = async (tag) =>
  compileTagging(
    await readFile(new URL(`data/${tag}.txt`, import.meta.url), "utf8"),
  );

/**
 * @template {import("./tag").Tag} T
 * @param {T[]} tags
 * @returns {Promise<(
 *  specifier: import("../result").TestSpecifier,
 * ) => T[]>}
 */
export const loadTaggingList = async (tags) => {
  /**
   * @type {[
   *   T,
   *   (specifier: import("../result").TestSpecifier) => boolean,
   * ][]}
   */
  const entries = [];
  for (const tag of tags) {
    entries.push([tag, await loadTagging(tag)]);
  }
  return (specifier) =>
    entries.filter(([_tag, tagging]) => tagging(specifier)).map(getFirst);
};
