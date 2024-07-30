import { readFile } from "node:fs/promises";
import { matchSelection, parseSelection } from "./selection.mjs";
import { unwrapSettleArray } from "./util.mjs";

const { URL, Promise } = globalThis;

/**
 * @type {(
 *   tagging: import("./tagging").Tagging,
 *   target: string,
 * ) => string[]}
 */
export const listTag = (tagging, target) => {
  const tags = [];
  for (const [selection, tag] of tagging) {
    if (matchSelection(selection, target)) {
      tags.push(tag);
    }
  }
  return tags;
};

/**
 * @type {(
 *   tag: string,
 * ) => Promise<import("./tagging").TaggingEntry>}
 */
const loadTaggingEntry = async (tag) => [
  parseSelection(
    await readFile(new URL(`./tagging/${tag}.txt`, import.meta.url), "utf8"),
  ),
  tag,
];

/**
 * @type {(
 *   tags: string[],
 * ) => Promise<import("./tagging").Tagging>}
 */
export const loadTagging = async (tags) =>
  unwrapSettleArray(await Promise.allSettled(tags.map(loadTaggingEntry)));
