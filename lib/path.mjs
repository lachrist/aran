import { AranError } from "./error.mjs";
import { hasNarrowObject } from "./util/index.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split, substring, startsWith },
  },
} = globalThis;

const SEP = ".";

const SEP_SINGLETON = [SEP];

export const ROOT_PATH = /** @type {import("./path").Path} */ ("$");

/**
 * @type {(
 *   path: import("./path").Path,
 *   segment: import("./path").Segment,
 * ) => import("./path").Path}
 */
export const joinPath = (path, segment) =>
  /** @type {import("./path").Path} */ (`${path}${SEP}${segment}`);

/**
 * @type {(
 *   path: import("./path").Path,
 *   segment1: import("./path").Segment,
 *   segment2: import("./path").Segment,
 * ) => import("./path").Path}
 */
export const joinDeepPath = (path, segment1, segment2) =>
  /** @type {import("./path").Path} */ (
    `${path}${SEP}${segment1}${SEP}${segment2}`
  );

/**
 * @type {(
 *   path: import("./path").Path,
 *   segment1: import("./path").Segment,
 *   segment2: import("./path").Segment,
 *   segment3: import("./path").Segment,
 * ) => import("./path").Path}
 */
export const joinVeryDeepPath = (path, segment1, segment2, segment3) =>
  /** @type {import("./path").Path} */ (
    `${path}${SEP}${segment1}${SEP}${segment2}${SEP}${segment3}`
  );

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   path: import("./path").Path,
 * ) => number}
 */
export const getPathDeph = (path) => {
  let depth = 0;
  const { length } = path;
  for (let index = 0; index < length; index += 1) {
    if (path[index] === SEP) {
      depth += 1;
    }
  }
  return depth;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   path: import("./path").Path,
 *   base: import("./path").Path,
 * ) => import("./path").Segment[]}
 */
export const splitPath = (path, base) => {
  if (path === base) {
    return [];
  } else if (apply(startsWith, path, [`${base}${SEP}`])) {
    return apply(
      split,
      apply(substring, path, [base.length + 1]),
      SEP_SINGLETON,
    );
  } else {
    throw new AranError("path does not start by base", { path, base });
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   segments: import("./path").Segment[],
 *   root: import("./estree").Program,
 * ) => import("./estree").Node | import("./estree").Node[]}
 */
export const walkPath = (segments, root) => {
  /** @type {import("./estree").Node | import("./estree").Node[]} */
  let node = root;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (hasNarrowObject(node, segment)) {
      node = /** @type {any} */ (node[segment]);
    } else {
      throw new AranError("invalid path", {
        segment,
        node,
        path: segments,
        root,
      });
    }
  }
  return node;
};
/* eslint-enable local/no-impure */
