import { AranTypeError } from "../error.mjs";
import {
  isConstantMetaVariable,
  mangleConstantMetaVariable,
  mangleWritableMetaVariable,
} from "./mangle.mjs";
import {
  makeInitMetaEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadMetaExpression,
  makeWriteMetaEffect,
} from "./node.mjs";
import {
  initSequence,
  nextSequence,
  tellSequence,
  zeroSequence,
} from "./sequence.mjs";

/**
 * @template X
 * @typedef {(
 *   import("./sequence.js").Sequence<
 *     aran.Effect<unbuild.Atom>,
 *     X,
 *   >
 * )} Sequence
 */

/**
 * @typedef {import("./cache.d.ts").Cache} Cache
 */

/**
 * @typedef {import("./cache.d.ts").ConstantCache} ConstantCache
 */

/**
 * @typedef {import("./cache.d.ts").WritableCache} WritableCache
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   node: aran.Expression<unbuild.Atom>,
 * ) => Sequence<ConstantCache>}
 */
export const setupConstantCache = ({ path, meta }, node) => {
  if (node.type === "IntrinsicExpression") {
    return zeroSequence({ type: "intrinsic", intrinsic: node.intrinsic });
  } else if (node.type === "PrimitiveExpression") {
    return zeroSequence({ type: "primitive", primitive: node.primitive });
  } else if (
    node.type === "ReadExpression" &&
    isConstantMetaVariable(node.variable)
  ) {
    return zeroSequence({ type: "constant", variable: node.variable });
  } else if (node.type === "SequenceExpression") {
    return nextSequence(
      tellSequence(node.head),
      setupConstantCache({ path, meta }, node.tail),
    );
  } else {
    const variable = mangleConstantMetaVariable(meta);
    return initSequence([makeInitMetaEffect(variable, node, path)], {
      type: "constant",
      variable,
    });
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   node: aran.Expression<unbuild.Atom>,
 * ) => Sequence<WritableCache>}
 */
export const setupWritableCache = ({ path, meta }, node) => {
  const variable = mangleWritableMetaVariable(meta);
  return initSequence([makeInitMetaEffect(variable, node, path)], {
    type: "writable",
    variable,
  });
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   cache: Cache,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadCacheExpression = ({ path }, cache) => {
  switch (cache.type) {
    case "primitive": {
      return makePrimitiveExpression(cache.primitive, path);
    }
    case "intrinsic": {
      return makeIntrinsicExpression(cache.intrinsic, path);
    }
    case "constant": {
      return makeReadMetaExpression(cache.variable, path);
    }
    case "writable": {
      return makeReadMetaExpression(cache.variable, path);
    }
    default: {
      throw new AranTypeError("invalid cache", cache);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   cache: WritableCache,
 *   value: aran.Expression<unbuild.Atom>,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteCacheEffect = ({ path }, cache, node) => [
  makeWriteMetaEffect(cache.variable, node, path),
];
