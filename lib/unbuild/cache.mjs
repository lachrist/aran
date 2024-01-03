import { AranTypeError } from "../error.mjs";
import { map } from "../util/index.mjs";
import {
  isConstantMetaVariable,
  mangleConstantMetaVariable,
  mangleWritableMetaVariable,
} from "./mangle.mjs";
import {
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "./node.mjs";
import { makeDeclarationPrelude, makeEffectPrelude } from "./prelude.mjs";
import {
  initSequence,
  zeroSequence,
  bindSequence,
  prependSequence,
} from "./sequence.mjs";

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 * ) => import("./cache").ConstantCache}
 */
export const cacheIntrinsic = (intrinsic) => ({
  type: "intrinsic",
  intrinsic,
});

/**
 * @type {(
 *   intrinsic: aran.Primitive,
 * ) => import("./cache").ConstantCache}
 */
export const cachePrimitive = (primitive) => ({
  type: "primitive",
  primitive,
});

/**
 * @type {(
 *   meta: import("./meta").Meta,
 *   node: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").SetupSequence<
 *   import("./cache").ConstantCache
 * >}
 */
export const cacheConstant = (meta, node, path) =>
  bindSequence(node, (node) => {
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
      return prependSequence(
        map(node.head, makeEffectPrelude),
        cacheConstant(meta, zeroSequence(node.tail), path),
      );
    } else {
      const variable = mangleConstantMetaVariable(meta);
      return bindSequence(
        makeWriteEffect(variable, zeroSequence(node), path),
        (nodes) =>
          initSequence(
            [
              makeDeclarationPrelude(variable),
              ...map(nodes, makeEffectPrelude),
            ],
            { type: "constant", variable },
          ),
      );
    }
  });

// /**
//  * @type {(
//  *   meta: import("./meta").Meta,
//  *   makeNode: (
//  *     cache: import("./cache").ConstantCache,
//  *   ) => aran.Expression<unbuild.Atom>,
//  *   path: unbuild.Path,
//  * ) => import("./sequence").Sequence<
//  *   import("./prelude").EffectPrelude,
//  *   import("./cache").ConstantCache
//  * >}
//  */
// export const cacheSelf = (meta, makeNode, path) => {
//   const variable = mangleConstantMetaVariable(meta);
//   /** @type {import("./cache").ConstantCache} */
//   const cache = {
//     type: "constant",
//     variable,
//   };
//   return initSequence(
//     [makeInitMetaEffect(variable, makeNode(cache), path)],
//     cache,
//   );
// };

/**
 * @type {(
 *   meta: import("./meta").Meta,
 *   node: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").SetupSequence<
 *   import("./cache").WritableCache
 * >}
 */
export const cacheWritable = (meta, node, path) => {
  const variable = mangleWritableMetaVariable(meta);
  return bindSequence(makeWriteEffect(variable, node, path), (nodes) =>
    initSequence(
      [makeDeclarationPrelude(variable), ...map(nodes, makeEffectPrelude)],
      { type: "writable", variable },
    ),
  );
};

/**
 * @type {(
 *   cache: import("./cache").Cache,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeReadCacheExpression = (cache, path) => {
  if (cache.type === "primitive") {
    return makePrimitiveExpression(cache.primitive, path);
  } else if (cache.type === "intrinsic") {
    return makeIntrinsicExpression(cache.intrinsic, path);
  } else if (cache.type === "constant" || cache.type === "writable") {
    return makeReadExpression(cache.variable, path);
  } else {
    throw new AranTypeError(cache);
  }
};

/**
 * @type {(
 *   cache: import("./cache").WritableCache,
 *   node: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const listWriteCacheEffect = (cache, node, path) =>
  makeWriteEffect(cache.variable, node, path);
