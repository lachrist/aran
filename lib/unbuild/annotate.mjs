import { StaticError, hasOwn } from "../util/index.mjs";

const {
  Array: { isArray },
  Object: { fromEntries: reduceEntry, entries: listEntry },
  Reflect: { ownKeys: listKey, defineProperty },
} = globalThis;

const KEY = "_ARAN_PATH_";

const ROOT = /** @type {unbuild.Path} */ ("$");

/** @type {<X>(node: X, path: unbuild.Path) => void} */
export const annotateInPlace = (node, path) => {
  if (typeof node === "object" && node !== null && hasOwn(node, "type")) {
    for (const key of listKey(node)) {
      if (typeof key === "string") {
        annotateInPlace(
          /** @type {any} */ (node)[key],
          /** @type {unbuild.Path} */ (`${path}.${key}`),
        );
      }
    }
    defineProperty(
      node,
      KEY,
      /** @type {PropertyDescriptor} */ ({
        __proto__: null,
        writable: true,
        enumerable: true,
        configurable: true,
        value: path,
      }),
    );
  } else if (isArray(node)) {
    const { length } = node;
    for (let index = 0; index < length; index += 1) {
      annotateInPlace(
        node[index],
        /** @type {unbuild.Path} */ (`${path}.${index}`),
      );
    }
  }
};

/**
 * @template X
 * @param {X} node
 * @param {unbuild.Path} path
 * @return {X}
 */
export const annotateCopy = (node, path) => {
  if (typeof node === "object" && node !== null && hasOwn(node, "type")) {
    const entries = listEntry(node);
    const { length } = entries;
    for (let index = 0; index < length; index += 1) {
      const entry = entries[index];
      const key = entry[0];
      if (
        key !== "type" &&
        key !== "loc" &&
        key !== "start" &&
        key !== "end" &&
        key !== "range"
      ) {
        entry[1] = annotateCopy(
          entry[1],
          /** @type {unbuild.Path} */ (`${path}.${key}`),
        );
      }
    }
    entries[length] = [KEY, path];
    return /** @type {X} */ (reduceEntry(entries));
  } else if (isArray(node)) {
    const copy = [...node];
    const { length } = copy;
    for (let index = 0; index < length; index += 1) {
      copy[index] = annotateCopy(
        copy[index],
        /** @type {unbuild.Path} */ (`${path}.${index}`),
      );
    }
    return /** @type {X} */ (copy);
  } else {
    return node;
  }
};

/**
 * @type {(
 *   node: estree.Program,
 *   path: unbuild.Path | null,
 *   annotation: "copy" | "in-place",
 * ) => estree.Program}
 */
export const annotate = (node, path, annotation) => {
  switch (annotation) {
    case "in-place":
      annotateInPlace(node, path === null ? ROOT : path);
      return node;
    case "copy":
      return annotateCopy(node, path === null ? ROOT : path);
    default:
      throw new StaticError("invalid annotation", annotation);
  }
};

/** @type {(node: estree.Node) => unbuild.Path} */
export const getPath = (/** @type {any} */ { [KEY]: path }) => path;
