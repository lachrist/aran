import { readFile } from "node:fs/promises";
import { AranExecError } from "../../../error.mjs";
import { isTestSpecifier } from "../../../result.mjs";

const { Set, URL, isNaN, parseInt } = globalThis;

/**
 * @typedef {{
 *   specifier: import("../../../result").TestSpecifier,
 *   count: number,
 * }} Entry
 */

/**
 * @type {(
 *   line: string,
 * ) => Entry}
 */
const parseLine = (line) => {
  const parts = line.split(" >> ");
  if (parts.length !== 2) {
    throw new AranExecError("invalid line", { line });
  }
  const specifier = parts[0];
  if (!isTestSpecifier(specifier)) {
    throw new AranExecError("invalid specifier", { specifier });
  }
  const count = parseInt(parts[1]);
  if (isNaN(count)) {
    throw new AranExecError("invalid count", { count });
  }
  return { specifier, count };
};

/**
 * @type {(
 *   line: string,
 * ) => boolean}
 */
const isNotEmptyLine = (line) => line !== "";

/**
 * @type {(
 *   entry: Entry,
 * ) => boolean}
 */
const isEntryBelowThreshold = ({ count }) => count <= 512;

/**
 * @type {(
 *   entry: Entry,
 * ) => import("../../../result").TestSpecifier}
 */
const getEntrySpecifier = ({ specifier }) => specifier;

/**
 * @type {(
 *   content: string,
 * ) => import("../../../result").TestSpecifier[]}
 */
const extractExclusion = (content) =>
  content
    .split("\n")
    .filter(isNotEmptyLine)
    .map(parseLine)
    .filter(isEntryBelowThreshold)
    .map(getEntrySpecifier);

const exclusion = new Set(
  extractExclusion(
    await readFile(new URL("count/data.txt", import.meta.url), "utf-8"),
  ),
);

/**
 * @type {(
 *   specifier: import("../../../result").TestSpecifier,
 * ) => import("../../../tagging/tag").Tag[]}
 */
export const listThresholdExclusion = (specifier) =>
  exclusion.has(specifier)
    ? [/** @type {import("../../../tagging/tag").Tag} */ ("threshold")]
    : [];
