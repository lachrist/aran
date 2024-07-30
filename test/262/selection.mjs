import { parseList } from "./list.mjs";

const { Set, RegExp } = globalThis;

/**
 * @type {(
 *   content: string
 * ) => import("./selection").Selection}
 */
export const parseSelection = (content) => {
  const exact = new Set();
  const group = [];
  for (const line of parseList(content)) {
    if (line.startsWith("^")) {
      group.push(new RegExp(line, "u"));
    } else {
      exact.add(line);
    }
  }
  return { exact, group };
};

/**
 * @type {(
 *   selection: import("./selection").Selection,
 *   target: string,
 * ) => boolean}
 */
export const matchSelection = ({ exact, group }, target) => {
  if (exact.has(target)) {
    return true;
  } else {
    for (const regexp of group) {
      if (regexp.test(target)) {
        return true;
      }
    }
    return false;
  }
};
