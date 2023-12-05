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
  thenSequence,
  tellSequence,
  zeroSequence,
} from "./sequence.mjs";

/**
 * @type {(
 *   meta: unbuild.Meta,
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence<
 *   import("./cache").ConstantCache
 * >}
 */
export const cacheConstant = (meta, node, path) => {
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
    return thenSequence(
      tellSequence(node.head),
      cacheConstant(meta, node.tail, path),
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
 *   meta: unbuild.Meta,
 *   makeNode: (
 *     cache: import("./cache").ConstantCache,
 *   ) => aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence<
 *   import("./cache").ConstantCache
 * >}
 */
export const cacheSelf = (meta, makeNode, path) => {
  const variable = mangleConstantMetaVariable(meta);
  /** @type {import("./cache").ConstantCache} */
  const cache = {
    type: "constant",
    variable,
  };
  return initSequence(
    [makeInitMetaEffect(variable, makeNode(cache), path)],
    cache,
  );
};

/**
 * @type {(
 *   meta: unbuild.Meta,
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence<
 *   import("./cache").WritableCache
 * >}
 */
export const cacheWritable = (meta, node, path) => {
  const variable = mangleWritableMetaVariable(meta);
  return initSequence([makeInitMetaEffect(variable, node, path)], {
    type: "writable",
    variable,
  });
};

/**
 * @type {(
 *   cache: import("./cache").Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadCacheExpression = (cache, path) => {
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
 *   cache: import("./cache").WritableCache,
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteCacheEffect = (cache, node, path) => [
  makeWriteMetaEffect(cache.variable, node, path),
];
