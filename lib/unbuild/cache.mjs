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
import { initSequence, zeroSequence, prependSequence } from "./sequence.mjs";

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
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   (
 *     | import("./prelude").MetaDeclarationPrelude
 *     | import("./prelude").PrefixPrelude
 *   ),
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
    return prependSequence(
      map(node.head, makePrefixPrelude),
      cacheConstant(meta, node.tail, path),
    );
  } else {
    const variable = mangleConstantMetaVariable(meta);
    return initSequence(
      [
        makeMetaDeclarationPrelude([
          variable,
          {
            type: "intrinsic",
            intrinsic: "aran.deadzone",
          },
        ]),
        makePrefixPrelude(makeWriteEffect(variable, node, path)),
      ],
      { type: "constant", variable },
    );
  }
};

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
 * ) => aran.Expression<unbuild.Atom>}
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
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteCacheEffect = (cache, node, path) =>
  makeWriteEffect(cache.variable, node, path);
