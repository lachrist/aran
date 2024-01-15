/* eslint-disable local/no-impure */

import { AranError } from "../error.mjs";
import { flatMap, hasNarrowObject } from "../util/index.mjs";

const {
  parseInt,
  Reflect: { apply },
  Array: {
    isArray,
    prototype: { pop, includes },
  },
  String: {
    prototype: { split },
  },
} = globalThis;

const DOT = ["."];

/** @type {[]} */
const EMPTY = [];

const valued = [
  "ExpressionStatement",
  "WithStatement",
  "IfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "SwitchStatement",
  "TryStatement",
  "SwitchStatement",
  "ThrowStatement",
];

/**
 * @type {(
 *   path: string[],
 *   root: estree.Program,
 * ) => estree.Node | estree.Node[]}
 */
const dig = (path, root) => {
  /** @type {estree.Node | estree.Node[]} */
  let node = root;
  for (const segment of path) {
    if (segment === "$") {
      node = root;
    } else if (hasNarrowObject(node, segment)) {
      node = /** @type {any} */ (node[segment]);
    } else {
      throw new AranError("invalid path", { path, root, node, segment });
    }
  }
  return node;
};

/**
 * @type {(node: estree.Node) => estree.Node[]}
 */
const extractBody = (node) => {
  switch (node.type) {
    case "BlockStatement": {
      return flatMap(node.body, extractBody);
    }
    case "SwitchCase": {
      return flatMap(node.consequent, extractBody);
    }
    case "LabeledStatement": {
      return extractBody(node.body);
    }
    default: {
      return [node];
    }
  }
};

/**
 * @type {(
 *   path: string[],
 *   root: estree.Program,
 * ) => boolean}
 */
const isLastValueInner = (path, root) => {
  const init = [...path];
  const tail = apply(pop, init, EMPTY);
  const parent = dig(init, root);
  if (isArray(parent)) {
    const { length } = parent;
    for (let index = parseInt(tail) + 1; index < length; index += 1) {
      for (const { type } of extractBody(parent[index])) {
        if (type === "BreakStatement" || type === "ContinueStatement") {
          return true;
        }
        if (apply(includes, valued, [type])) {
          return false;
        }
      }
    }
    return isLastValueInner(init, root);
  } else {
    switch (parent.type) {
      case "Program": {
        return true;
      }
      case "TryStatement": {
        return tail === "finally" ? false : isLastValueInner(init, root);
      }
      default: {
        return isLastValueInner(init, root);
      }
    }
  }
};

/**
 * @type {(
 *   path: unbuild.Path,
 *   root: estree.Program,
 * ) => boolean}
 */
export const isLastValue = (path, root) =>
  isLastValueInner(apply(split, path, DOT), root);
