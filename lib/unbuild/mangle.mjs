import { getFirstZeroPrimeIndex, primeAt, mapIndex } from "../util/index.mjs";

const {
  Array,
  BigInt,
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
  Number: {
    prototype: { toString },
  },
  Object: { fromEntries: reduceEntry },
} = globalThis;

const DEADZONE = "dead";

const META = "aran";

const DEADZONE_SINGLETON = [`${DEADZONE}.`];

const META_SINGLETON = [`${META}.`];

const RADIX = 32;

const RADIX_SINGLETON = [RADIX];

// To enforce the scope abstraction:
// this should only be accessed by lib/unbuild/scope/bindings/regular.mjs
/** @type {(variable: estree.Variable) => unbuild.DeadzoneBaseVariable} */
export const mangleBaseDeadzoneVariable = (variable) =>
  /** @type {unbuild.DeadzoneBaseVariable} */ (`${DEADZONE}.${variable}`);

// To enforce the scope abstraction:
// This should only be accessed by lib/unbuild/scope/bindings/regular.mjs
/** @type {(variable: estree.Variable) => unbuild.OriginalBaseVariable} */
export const mangleBaseOriginalVariable = (variable) =>
  /** @type {unbuild.OriginalBaseVariable} */ (
    /** @type {string} */ (variable)
  );

export const ROOT_META = /** @type {unbuild.RootMeta} */ 1n;

/** @type {(meta: unbuild.Meta | unbuild.RootMeta) => unbuild.RootMeta} */
export const forkMeta = (meta) =>
  /** @type {unbuild.RootMeta} */ (
    meta * primeAt(getFirstZeroPrimeIndex(meta))
  );

/** @type {(meta: unbuild.Meta | unbuild.RootMeta) => unbuild.Meta} */
export const nextMeta = (meta) =>
  /** @type {unbuild.Meta} */ (
    meta * primeAt(getFirstZeroPrimeIndex(meta) - 1)
  );

/** @type {(meta: unbuild.Meta | unbuild.RootMeta) => unbuild.MetaVariable} */
export const mangleMetaVariable = (meta) =>
  /** @type {unbuild.MetaVariable} */ (
    `${META}.${apply(toString, meta, RADIX_SINGLETON)}`
  );

// const accumulateMeta = ({ meta, matrix }, element) => ({
//   meta: nextMeta(meta),
//   array:
// });

// /**
//  * @type {<X>(
//  *   meta: unbuild.Meta | unbuild.RootMeta,
//  *   array: X[],
//  * ) => [meta, X][]}
//  */
// export const zipMeta = (meta, array) => {
//   const result = [];
//   const { length } = array;
//   for (let index = 0; index < array; index += 1) {
//     result[index] = [meta, array[index]];
//     meta = nextMeta(meta);
//   }
//   return result;
// };

// /**
//  * @type {(
//  *   meta: unbuild.RootMeta,
//  *   index: number,
//  * ) => unbuild.Meta}
//  */
// export const extendMeta = (meta, index) =>
//   /** @type {unbuild.Meta} */ (
//     `${meta}${index < RADIX ? "" : "$"}${apply(
//       toString,
//       index,
//       RADIX_SINGLETON,
//     )}`
//   );

/**
 * @type {<K extends string>(
 *   meta: unbuild.RootMeta,
 *   keys: K[],
 * ) => { [key in K]: unbuild.Meta }}
 */
export const splitMeta = (root, keys) => {
  const prime = primeAt(getFirstZeroPrimeIndex(root) - 1);
  return /** @type {any} */ (
    reduceEntry(
      mapIndex(keys.length, (index) => [
        keys[index],
        root * prime ** BigInt(index),
      ]),
    )
  );
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   meta: unbuild.RootMeta,
 *   length: number,
 * ) => unbuild.Meta[]}
 */
export const enumMeta = (root, length) => {
  let meta = /** @type {unbuild.Meta} */ (/** @type {unknown} */ (root));
  const metas = new Array(length);
  for (let index = 0; index < length; index += 1) {
    metas[index] = meta;
    meta = nextMeta(meta);
  }
  return metas;
};
/* eslint-enable local/no-impure */

// /**
//  * @type {(
//  *   meta: unbuild.RootMeta,
//  *   name: string,
//  * ) => unbuild.MetaVariable}
//  */
// export const mangleMetaVariable = (meta, name) =>
//   /** @type {unbuild.MetaVariable} */ (`${META}.${meta}.${name}`);

// /**
//  * @type {<X>(
//  *   meta: unbuild.MetaVariable,
//  *   array: X[],
//  * ) => [unbuild.MetaVariable, X][]}
//  */
// export const zipMetaVariable = (meta, xs) => {
//   const separator = xs.length < RADIX ? "$" : "";
//   return zip(
//     mapIndex(
//       xs.length,
//       (index) =>
//         /** @type {unbuild.MetaVariable} */ (
//           `${meta}${separator}${apply(toString, index, RADIX_SINGLETON)}`
//         ),
//     ),
//     xs,
//   );
// };

/**
 * @type {(
 *   variable: unbuild.Variable,
 * ) => variable is unbuild.MetaVariable}
 */
export const isMetaVariable = (variable) =>
  apply(startsWith, variable, META_SINGLETON);

/**
 * @type {(
 *   variable: unbuild.Variable,
 * ) => variable is unbuild.DeadzoneBaseVariable}
 */
export const isBaseDeadzoneVariable = (variable) =>
  apply(startsWith, variable, DEADZONE_SINGLETON);

/**
 * @type {(
 *   variable: unbuild.Variable,
 * ) => variable is unbuild.OriginalBaseVariable}
 */
export const isBaseOriginalVariable = (variable) =>
  !isBaseDeadzoneVariable(variable) && !isMetaVariable(variable);

/** @type {(label: unbuild.Path) => unbuild.Label}  */
export const mangleEmptyBreakLabel = (path) =>
  /** @type {unbuild.Label} */ (`break.loop.${path}`);

/** @type {(label: estree.Label) => unbuild.Label}  */
export const mangleBreakLabel = (label) =>
  /** @type {unbuild.Label} */ (`break.${label}`);

/** @type {(label: unbuild.Path) => unbuild.Label}  */
export const mangleEmptyContinueLabel = (path) =>
  /** @type {unbuild.Label} */ (`continue.loop.${path}`);

/** @type {(label: estree.Label) => unbuild.Label}  */
export const mangleContinueLabel = (label) =>
  /** @type {unbuild.Label} */ (
    label === null ? "continue" : `continue.${label}`
  );
