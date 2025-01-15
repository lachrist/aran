import { parseList } from "./list.mjs";

const { Set, RegExp } = globalThis;

/**
 * @type {<K extends string>(
 *   content: string,
 *   listExactKey: (
 *     line: string,
 *   ) => K[],
 * ) => import("./selection").Selection<K>}
 */
export const parseSelection = (content, listExactKey) => {
  const exact = new Set();
  const group = [];
  for (const line of parseList(content)) {
    if (line.startsWith("^")) {
      group.push(new RegExp(line, "u"));
    } else {
      for (const key of listExactKey(line)) {
        exact.add(key);
      }
    }
  }
  return { exact, group };
};

/**
 * @type {<K extends string>(
 *   selection: import("./selection").Selection<K>,
 *   specifier: K,
 * ) => boolean}
 */
export const matchSelection = ({ exact, group }, specifier) => {
  if (exact.has(specifier)) {
    return true;
  } else {
    for (const regexp of group) {
      if (regexp.test(specifier)) {
        return true;
      }
    }
    return false;
  }
};

/**
 * @template {string} K
 * @template V
 * @param {import("./selection").SelectionMapping<K, V>} recording
 * @param {K} specifier
 * @returns {V[]}
 */
export const listSelectionValue = (recording, specifier) => {
  /** @type {V[]} */
  const values = [];
  for (const [selection, value] of recording) {
    if (matchSelection(selection, specifier)) {
      values.push(value);
    }
  }
  return values;
};
