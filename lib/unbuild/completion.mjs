import { flatMap } from "../util/index.mjs";
import { walkPath, splitPath } from "../path.mjs";

const {
  parseInt,
  Reflect: { apply },
  Array: {
    isArray,
    prototype: { pop, includes },
  },
} = globalThis;

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

/** @type {import("./completion").VoidCompletion} */
export const VOID_COMPLETION = {
  type: "void",
};

/**
 * @type {(
 *   completion: import("./completion").Completion,
 * ) => completion is import("./completion").IndirectCompletion}
 */
export const isIndirectCompletion = (completion) =>
  completion.type === "indirect";

/**
 * @type {(
 *   cache: import("./cache").WritableCache,
 *   root: estree.Program,
 * ) => import("./completion").ProgramCompletion}
 */
export const makeIndirectCompletion = (cache, root) => ({
  type: "indirect",
  cache,
  root,
});

/**
 * @type {(
 *   site: import("./site").Site<estree.Expression>,
 * ) => import("./completion").ProgramCompletion}
 */
export const makeDirectCompletion = (site) => ({
  type: "direct",
  site,
});

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

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   path: import("../path").Segment[],
 *   root: estree.Program,
 * ) => boolean}
 */
const isLastValueInner = (path, root) => {
  const init = [...path];
  const tail = apply(pop, init, EMPTY);
  const parent = walkPath(init, root);
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
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   path: unbuild.Path,
 *   root: estree.Program,
 * ) => boolean}
 */
export const isLastValue = (path, root) =>
  isLastValueInner(splitPath(path), root);
