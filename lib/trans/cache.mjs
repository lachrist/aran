import { AranTypeError } from "../error.mjs";
import {
  map,
  initSequence,
  zeroSequence,
  prependSequence,
} from "../util/index.mjs";
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

/**
 * @type {(
 *   intrinsic: import("../lang/syntax.d.ts").Intrinsic,
 * ) => import("./cache.d.ts").ConstantCache}
 */
export const cacheIntrinsic = (intrinsic) => ({
  type: "intrinsic",
  intrinsic,
});

/**
 * @type {(
 *   intrinsic: import("../lang/syntax.d.ts").SyntaxPrimitive,
 * ) => import("./cache.d.ts").ConstantCache}
 */
export const cachePrimitive = (primitive) => ({
  type: "primitive",
  primitive,
});

/**
 * @type {(
 *   meta: import("./meta.d.ts").Meta,
 *   node: import("./atom.d.ts").Expression,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   (
 *     | import("./prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("./prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./cache.d.ts").ConstantCache
 * >}
 */
export const cacheConstant = (meta, node, hash) => {
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
      cacheConstant(meta, node.tail, hash),
    );
  } else {
    const variable = mangleConstantMetaVariable(meta);
    return initSequence(
      [
        makeMetaDeclarationPrelude([variable, "aran.deadzone_symbol"]),
        makePrefixPrelude(makeWriteEffect(variable, node, hash)),
      ],
      { type: "constant", variable },
    );
  }
};

/**
 * @type {(
 *   meta: import("./meta.d.ts").Meta,
 *   intrinsic: import("../lang/syntax.d.ts").Intrinsic,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").MetaDeclarationPrelude,
 *   import("./cache.d.ts").WritableCache
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
 *   node: import("estree-sentry").TaggedTemplateExpression<import("./hash.d.ts").HashProp>,
 *   meta: import("./meta.d.ts").Meta,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").TemplatePrelude,
 *   import("./cache.d.ts").ConstantCache
 * >}
 */
export const cacheTemplate = (node, meta) => {
  const variable = mangleConstantMetaVariable(meta);
  return initSequence(
    [
      makeTemplatePrelude({
        variable,
        value: node,
      }),
    ],
    {
      type: "constant",
      variable,
    },
  );
};

/**
 * @type {(
 *   cache: import("./cache.d.ts").Cache,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").Expression}
 */
export const makeReadCacheExpression = (cache, hash) => {
  if (cache.type === "primitive") {
    return makePrimitiveExpression(cache.primitive, hash);
  } else if (cache.type === "intrinsic") {
    return makeIntrinsicExpression(cache.intrinsic, hash);
  } else if (cache.type === "constant" || cache.type === "writable") {
    return makeReadExpression(cache.variable, hash);
  } else {
    throw new AranTypeError(cache);
  }
};

/**
 * @type {(
 *   cache: import("./cache.d.ts").WritableCache,
 *   node: import("./atom.d.ts").Expression,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").Effect}
 */
export const makeWriteCacheEffect = (cache, node, hash) =>
  makeWriteEffect(cache.variable, node, hash);
