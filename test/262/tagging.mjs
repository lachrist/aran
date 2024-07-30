import { readFile } from "node:fs/promises";
import { matchSelection, parseSelection } from "./selection.mjs";

const { URL, Promise } = globalThis;

/**
 * @type {(
 *   entry: [string, string],
 * ) => import("./tagging").TaggingEntry}
 */
const parseTaggingEntry = ([tag, content]) => [parseSelection(content), tag];

/**
 * @type {(
 *   entries: [string, string][],
 * ) => import("./tagging").Tagging}
 */
export const parseTagging = (entries) => entries.map(parseTaggingEntry);

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
 *   tags: string[],
 * ) => Promise<import("./tagging").Tagging>}
 */
export const loadTagging = async (tags) =>
  parseTagging(
    await Promise.all(
      tags.map(async (tag) => [
        tag,
        await readFile(
          new URL(`./tagging/${tag}.txt`, import.meta.url),
          "utf8",
        ),
      ]),
    ),
  );
