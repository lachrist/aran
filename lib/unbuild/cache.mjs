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
import { makeMetaDeclarationPrelude, makePrefixPrelude } from "./prelude.mjs";
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
 * @type {<P extends import("./prelude").NodePrelude>(
 *   meta: import("./meta").Meta,
 *   node: import("./sequence").Sequence<
 *     P,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   (
 *     | P
 *     | import("./prelude").MetaDeclarationPrelude
 *     | import("./prelude").RegularPrefixPrelude
 *   ),
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
        map(node.head, makePrefixPrelude),
        cacheConstant(meta, zeroSequence(node.tail), path),
      );
    } else {
      const variable = mangleConstantMetaVariable(meta);
      return bindSequence(
        makeWriteEffect(variable, zeroSequence(node), path),
        (nodes) =>
          initSequence(
            [
              makeMetaDeclarationPrelude([
                variable,
                {
                  type: "intrinsic",
                  intrinsic: "aran.deadzone",
                },
              ]),
              ...map(nodes, makePrefixPrelude),
            ],
            { type: "constant", variable },
          ),
      );
    }
  });

/**
 * @type {(
 *   meta: import("./meta").Meta,
 *   isolate: aran.Isolate,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./cache").WritableCache
 * >}
 */
export const cacheWritable = (meta, isolate) => {
  const variable = mangleWritableMetaVariable(meta);
  return initSequence([makeMetaDeclarationPrelude([variable, isolate])], {
    type: "writable",
    variable,
  });
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
