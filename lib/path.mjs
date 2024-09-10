import { AranExecError } from "./report";
import { hasNarrowObject } from "./util/index.mjs";

const {
  Array,
  Array: { isArray },
  Object: { hasOwn },
  Reflect: { apply },
  String: {
    prototype: { split, substring, startsWith },
  },
} = globalThis;

export const ROOT_PATH = /** @type {import("./path").Path} */ ("$");

const TAG = "_aran_path";

const SEP = ".";

const SEP_SINGLETON = [SEP];

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: unknown,
 *   path: string,
 * ) => unknown}
 */
export const loop = (node, path) => {
  if (isArray(node)) {
    const { length } = node;
    const copy = new Array(length);
    for (let index = 0; index < length; index++) {
      copy[index] = loop(node, `${path}${SEP}${index}`);
    }
    return copy;
  } else if (
    typeof node === "object" &&
    node !== null &&
    hasOwn(node, "type")
  ) {
    const copy = /** @type {any} */ ({
      __proto__: null,
      [TAG]: path,
      ...node,
    });
    for (const key in copy) {
      copy[key] = loop(copy[key], `${path}${SEP}${key}`);
    }
    return copy;
  } else {
    return node;
  }
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   node: import("./estree").Program,
 *   path: import("./path").Path,
 * ) => import("./estree").Program}
 */
export const tagPath = /** @type {any} */ (loop);

/**
 * @type {(
 *   node: import("./estree").Node,
 * ) => import("./path").Path}
 */
export const getPath = (node) => /** @type {any} */ (node)[TAG];

// /**
//  * @type {(
//  *   path: import("./path").Path,
//  *   segment: import("./path").Segment,
//  * ) => import("./path").Path}
//  */
// export const joinPath = (path, segment) =>
//   /** @type {import("./path").Path} */ (`${path}${SEP}${segment}`);

// /**
//  * @type {(
//  *   path: import("./path").Path,
//  *   segment1: import("./path").Segment,
//  *   segment2: import("./path").Segment,
//  * ) => import("./path").Path}
//  */
// export const joinDeepPath = (path, segment1, segment2) =>
//   /** @type {import("./path").Path} */ (
//     `${path}${SEP}${segment1}${SEP}${segment2}`
//   );

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
    throw new AranExecError("path does not start by base", { path, base });
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
      throw new AranExecError("invalid path", {
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
