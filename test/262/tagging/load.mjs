import { readFile } from "node:fs/promises";
import { trimString } from "../util/index.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   string: string,
 * ) => boolean}
 */
export const isNotEmptyLine = (string) =>
  string.length > 0 && string[0] !== "#";

/**
 * @type {(
 *   tag: import("./tag").Tag,
 * ) => Promise<(
 *   | import("../fetch").TestPath
 *   | import("../result").TestSpecifier
 * )[]>}
 */
export const loadTag = async (tag) =>
  /**
   * @type {(
   *   | import("../fetch").TestPath
   *   | import("../result").TestSpecifier
   * )[]}
   */ (
    (await readFile(new URL(`data/${tag}.txt`, import.meta.url), "utf-8"))
      .split("\n")
      .map(trimString)
      .filter(isNotEmptyLine)
  );
