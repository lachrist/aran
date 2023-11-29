import { compileGet, flatMap, map, reduceReverse } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import {
  isConstantMetaVariable,
  isMetaVariable,
  mangleConstantMetaVariable,
  mangleWritableMetaVariable,
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
import { makeLongSequenceExpression } from "./intrinsic.mjs";

/**
 * @typedef {import("./cache.d.ts").Cache} Cache
 */

/**
 * @typedef {import("./cache.d.ts").WritableCache} WritableCache
 */

/**
 * @typedef {import("./cache.d.ts").ConstantCache} ConstantCache
 */

/**
 * @template V
 * @typedef {import("./cache.d.ts").Setup<V>} Setup
 */

const getSetup = compileGet("setup");

const getValue = compileGet("value");

/////////////
// prepend //
/////////////

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

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
const prependClosureBlock = (head, tail, path) => ({
  ...tail,
  statements: prependStatement(head, tail.statements, path),
});

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
 * ) => Setup<ConstantCache>}
 */
const setupConstantCache = (node, { path, meta }) => {
  const variable = mangleConstantMetaVariable(meta);
  return {
    setup: [makeInitMetaEffect(variable, node, path)],
    value: { type: "constant", variable },
  };
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => Setup<WritableCache>}
 */
const setupWritableCache = (node, { path, meta }) => {
  const variable = mangleWritableMetaVariable(meta);
  return {
    setup: [makeInitMetaEffect(variable, node, path)],
    value: { type: "writable", variable },
  };
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => Setup<ConstantCache>}
 */
const setupConstantCacheRecycle = (node, { path, meta }) => {
  switch (node.type) {
    case "IntrinsicExpression": {
      return {
        setup: [],
        value: { type: "intrinsic", intrinsic: node.intrinsic },
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
      const { setup, value } = setupConstantCacheRecycle(node.tail, {
        path,
        meta,
      });
      return {
        setup: [node.head, ...setup],
        value,
      };
    }
    case "ReadExpression": {
      if (isConstantMetaVariable(node.variable)) {
        return {
          setup: [],
          value: { type: "constant", variable: node.variable },
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
 * @type {<K extends "constant" | "writable">(
 *   kind: K,
 *   node: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => Setup<K extends "constant" ? ConstantCache : WritableCache>}
 */
export const setupCache = (kind, node, { path, meta }) => {
  switch (kind) {
    case "constant": {
      return /** @type {any} */ (
        setupConstantCacheRecycle(node, { path, meta })
      );
    }
    case "writable": {
      return /** @type {any} */ (setupWritableCache(node, { path, meta }));
    }
    default: {
      throw new AranTypeError("invalid cache kind", kind);
    }
  }
};

/**
 * @type {<V>(
 *   setups: Setup<V>[],
 * ) => Setup<V[]>}
 */
export const sequenceSetup = (setups) => ({
  setup: flatMap(setups, getSetup),
  value: map(setups, getValue),
});

/**
 * @type {<V1, V2>(
 *   setup: Setup<V1>,
 *   update: (value: V1) => V2,
 * ) => Setup<V2>}
 */
export const mapSetup = ({ setup, value }, update) => ({
  setup,
  value: update(value),
});

/**
 * @type {<V1, V2>(
 *   setup: Setup<V1>,
 *   kontinue: (value: V1) => Setup<V2>,
 * ) => Setup<V2>}
 */
export const bindSetup = ({ setup: setup1, value: value1 }, kontinue) => {
  const { setup: setup2, value: value2 } = kontinue(value1);
  return {
    setup: [...setup1, ...setup2],
    value: value2,
  };
};

/**
 * @type {(
 *   setup: Setup<aran.Expression<unbuild.Atom>>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetupExpression = ({ setup, value }, path) =>
  makeLongSequenceExpression(setup, value, path);

/**
 * @type {(
 *   setup: Setup<aran.Effect<unbuild.Atom>[]>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupEffect = ({ setup, value }, _path) => [
  ...setup,
  ...value,
];

/**
 * @type {(
 *   setup: Setup<aran.Statement<unbuild.Atom>[]>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listSetupStatement = ({ setup, value }, path) => [
  ...map(setup, (node) => makeEffectStatement(node, path)),
  ...value,
];

/**
 * @type {(
 *   setup: Setup<aran.ClosureBlock<unbuild.Atom>>,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeSetupClosureBlock = ({ setup, value }, path) => ({
  ...value,
  statements: [
    ...map(setup, (node) => makeEffectStatement(node, path)),
    ...value.statements,
  ],
});

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
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteCacheEffect = (cache, value, path) => [
  makeWriteMetaEffect(cache.variable, value, path),
];

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
 *     value: K extends "constant" ? ConstantCache : WritableCache,
 *   ) => X,
 * ) => X}
 */
export const initCache = (kind, node, { path, meta }, prepend, kontinue) => {
  const { setup, value } = setupCache(kind, node, { path, meta });
  return reduceReverse(
    setup,
    (node2, node1) => prepend(node1, node2, path),
    kontinue(value),
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
 *   ) => aran.ClosureBlock<unbuild.Atom>,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeInitCacheClosureBlock = (kind, node, site, kontinue) =>
  initCache(kind, node, site, prependClosureBlock, kontinue);
