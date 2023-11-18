import { flatMap, map, reduceReverse } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import {
  isConstantMetaVariable,
  isMetaVariable,
  mangleConstantMetaVariable,
  mangleWritableMetaVariable,
  zipMeta,
} from "./mangle.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeInitMetaEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadMetaExpression,
  makeSequenceExpression,
  makeWriteMetaEffect,
} from "./node.mjs";

/**
 * @typedef {{
 *   type: "writable",
 *   variable: unbuild.WritableMetaVariable,
 * }} WritableCache
 */

/**
 * @typedef {{
 *   type: "primitive",
 *   primitive: aran.Primitive,
 * } | {
 *   type: "intrinsic",
 *   intrinsic: aran.Intrinsic,
 * } | {
 *   type: "constant",
 *   variable: unbuild.ConstantMetaVariable,
 * }} ConstantCache
 */

/**
 * @typedef {WritableCache | ConstantCache} Cache
 */

/**
 * @type {<X>(argument: { setup: X }) => X}
 */
const getSetup = ({ setup }) => setup;

/**
 * @type {<X>(argument: { cache: X }) => X}
 */
const getCache = ({ cache }) => cache;

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.Effect<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const prependEffect = (head, tail, _path) => [head, ...tail];

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.Statement<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const prependStatement = (head, tail, path) => [
  makeEffectStatement(head, path),
  ...tail,
];

///////////
// setup //
///////////

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom>[],
 *   cache: ConstantCache,
 * }}
 */
const setupConstantCache = (node, { path, meta }) => {
  const variable = mangleConstantMetaVariable(meta);
  return {
    setup: [makeInitMetaEffect(variable, node, path)],
    cache: { type: "constant", variable },
  };
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom>[],
 *   cache: WritableCache,
 * }}
 */
const setupWritableCache = (node, { path, meta }) => {
  const variable = mangleWritableMetaVariable(meta);
  return {
    setup: [makeInitMetaEffect(variable, node, path)],
    cache: { type: "writable", variable },
  };
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom>[],
 *   cache: ConstantCache,
 * }}
 */
const setupConstantCacheRecycle = (node, { path, meta }) => {
  switch (node.type) {
    case "IntrinsicExpression": {
      return {
        setup: [],
        cache: { type: "intrinsic", intrinsic: node.intrinsic },
      };
    }
    // Analyses based on shadow execution such as taint analysis benefit from
    // reusing primitive from the environment rather than creating new ones.
    //
    //
    // case "PrimitiveExpression": {
    //   return {
    //     setup: [],
    //     cache: { type: "primitive", primitive: node.primitive },
    //   };
    // }
    case "SequenceExpression": {
      const { setup, cache } = setupConstantCacheRecycle(node.tail, {
        path,
        meta,
      });
      return {
        setup: [node.head, ...setup],
        cache,
      };
    }
    case "ReadExpression": {
      if (isConstantMetaVariable(node.variable)) {
        return {
          setup: [],
          cache: { type: "constant", variable: node.variable },
        };
      } else {
        return setupConstantCache(node, { path, meta });
      }
    }
    default: {
      return setupConstantCache(node, { path, meta });
    }
  }
};

/**
 * @type {(
 *   kind: "constant" | "writable",
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom>[],
 *   cache: Cache,
 * }}
 */
const setupCache = (kind, node, { path, meta }) => {
  switch (kind) {
    case "constant": {
      return setupConstantCacheRecycle(node, { path, meta });
    }
    case "writable": {
      return setupWritableCache(node, { path, meta });
    }
    default: {
      throw new AranTypeError("invalid cache kind", kind);
    }
  }
};

//////////////////////
// listImpureEffect //
//////////////////////

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImpureEffect = (node, path) => {
  if (node.type === "ReadExpression" && isMetaVariable(node.variable)) {
    return [];
  } else {
    return [makeExpressionEffect(node, path)];
  }
};

//////////////////
// Read / Write //
//////////////////

/**
 * @type {(
 *   cache: Cache,
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
 *   cache: WritableCache,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteCacheEffect = (cache, value, path) =>
  makeWriteMetaEffect(cache.variable, value, path);

//////////
// Self //
//////////

/**
 * @type {(
 *   kind: "constant",
 *   self: (
 *     cache: ConstantCache,
 *   ) => aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     cache: ConstantCache,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSelfCacheExpression = (
  _kind,
  self,
  { path, meta },
  kontinue,
) => {
  const variable = mangleConstantMetaVariable(meta);
  const cache = /** @type {ConstantCache} */ ({ type: "constant", variable });
  return makeSequenceExpression(
    makeInitMetaEffect(variable, self(cache), path),
    kontinue(cache),
    path,
  );
};

//////////
// Init //
//////////

/**
 * @type {<K extends "constant" | "writable", X>(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   prepend: (
 *     head: aran.Effect<unbuild.Atom>,
 *     tail: X,
 *     path: unbuild.Path,
 *   ) => X,
 *   kontinue: (
 *     cache: K extends "constant" ? ConstantCache : WritableCache,
 *   ) => X,
 * ) => X}
 */
export const initCache = (kind, node, { path, meta }, prepend, kontinue) => {
  const { setup, cache } = setupCache(kind, node, { path, meta });
  return reduceReverse(
    setup,
    (node2, node1) => prepend(node1, node2, path),
    kontinue(/** @type {any} */ (cache)),
  );
};

/**
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     cache: K extends "constant" ? ConstantCache : WritableCache,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeInitCacheExpression = (kind, node, { path, meta }, kontinue) =>
  initCache(kind, node, { path, meta }, makeSequenceExpression, kontinue);

/**
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     cache: K extends "constant" ? ConstantCache : WritableCache,
 *   ) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitCacheEffect = (kind, node, site, kontinue) =>
  initCache(kind, node, site, prependEffect, kontinue);

/**
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     cache: K extends "constant" ? ConstantCache : WritableCache,
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listInitCacheStatement = (kind, node, site, kontinue) =>
  initCache(kind, node, site, prependStatement, kontinue);

//////////
// Enum //
//////////

/**
 * @type {<K extends "constant" | "writable", X>(
 *   kind: K,
 *   nodes: aran.Expression<unbuild.Atom>[],
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   prepend: (
 *     head: aran.Effect<unbuild.Atom>,
 *     tail: X,
 *     path: unbuild.Path,
 *   ) => X,
 *   kontinue: (
 *     caches: (K extends "constant" ? ConstantCache : WritableCache)[],
 *   ) => X,
 * ) => X}
 */
export const enumCache = (kind, nodes, { path, meta }, prepend, kontinue) => {
  const inits =
    /** @type {{setup: aran.Effect<unbuild.Atom>[], cache: Cache}[]} */ (
      map(zipMeta(meta, nodes), ([meta, node]) =>
        setupCache(kind, node, { path, meta }),
      )
    );
  return reduceReverse(
    flatMap(inits, getSetup),
    (node1, node2) => prepend(node2, node1, path),
    kontinue(/** @type {any} */ (map(inits, getCache))),
  );
};

/**
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   nodes: aran.Expression<unbuild.Atom>[],
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     caches: (K extends "constant" ? ConstantCache : WritableCache)[],
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnumCacheExpression = (
  kind,
  nodes,
  { path, meta },
  kontinue,
) => enumCache(kind, nodes, { path, meta }, makeSequenceExpression, kontinue);

/**
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>[],
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     caches: (K extends "constant" ? ConstantCache : WritableCache)[],
 *   ) => aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnumCacheEffect = (kind, nodes, { path, meta }, kontinue) =>
  enumCache(kind, nodes, { path, meta }, prependEffect, kontinue);

/**
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>[],
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kontinue: (
 *     caches: (K extends "constant" ? ConstantCache : WritableCache)[],
 *   ) => aran.Statement<unbuild.Atom>[],
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnumCacheStatement = (kind, nodes, { path, meta }, kontinue) =>
  enumCache(kind, nodes, { path, meta }, prependStatement, kontinue);
