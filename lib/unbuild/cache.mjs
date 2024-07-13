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
import {
  makeMetaDeclarationPrelude,
  makePrefixPrelude,
  makeTemplatePrelude,
} from "./prelude/index.mjs";
import { initSequence, zeroSequence, prependSequence } from "../sequence.mjs";

/**
 * @type {(
 *   intrinsic: import("../lang").Intrinsic,
 * ) => import("./cache").ConstantCache}
 */
export const cacheIntrinsic = (intrinsic) => ({
  type: "intrinsic",
  intrinsic,
});

/**
 * @type {(
 *   intrinsic: import("../lang").Primitive,
 * ) => import("./cache").ConstantCache}
 */
export const cachePrimitive = (primitive) => ({
  type: "primitive",
  primitive,
});

/**
 * @type {(
 *   meta: import("./meta").Meta,
 *   node: import("./atom").Expression,
 *   path: import("../path").Path,
 * ) => import("../sequence").Sequence<
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
        makeMetaDeclarationPrelude([variable, "aran.deadzone"]),
        makePrefixPrelude(makeWriteEffect(variable, node, path)),
      ],
      { type: "constant", variable },
    );
  }
};

/**
 * @type {(
 *   meta: import("./meta").Meta,
 *   intrinsic: import("../lang").Intrinsic,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./cache").WritableCache
 * >}
 */
export const cacheWritable = (meta, intrinsic) => {
  const variable = mangleWritableMetaVariable(meta);
  return initSequence([makeMetaDeclarationPrelude([variable, intrinsic])], {
    type: "writable",
    variable,
  });
};

/**
 * @type {(
 *   meta: import("./meta").Meta,
 *   value: import("./site").Site<import("../estree").TaggedTemplateExpression>,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").TemplatePrelude,
 *   import("./cache").ConstantCache
 * >}
 */
export const cacheTemplate = (meta, value) => {
  const variable = mangleConstantMetaVariable(meta);
  return initSequence([makeTemplatePrelude({ variable, value })], {
    type: "constant",
    variable,
  });
};

/**
 * @type {(
 *   cache: import("./cache").Cache,
 *   path: import("../path").Path,
 * ) => import("./atom").Expression}
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
 *   node: import("./atom").Expression,
 *   path: import("../path").Path,
 * ) => import("./atom").Effect}
 */
export const makeWriteCacheEffect = (cache, node, path) =>
  makeWriteEffect(cache.variable, node, path);
