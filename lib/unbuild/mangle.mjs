import { getFirstZeroPrimeIndex, primeAt } from "../util/prime.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
  Number: {
    prototype: { toString },
  },
} = globalThis;

const DEADZONE = "dead";

const META = "aran";

const DEADZONE_SINGLETON = [`${DEADZONE}.`];

const META_SINGLETON = [`${META}.`];

const RADIX = 36;

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

export const ROOT_META = /** @type {unbuild.Meta} */ 1n;

/** @type {(meta: unbuild.Meta) => unbuild.Meta} */
export const forkMeta = (meta) =>
  /** @type {unbuild.Meta} */ (meta * primeAt(getFirstZeroPrimeIndex(meta)));

/** @type {(meta: unbuild.Meta) => unbuild.Meta} */
export const nextMeta = (meta) =>
  /** @type {unbuild.Meta} */ (
    meta * primeAt(getFirstZeroPrimeIndex(meta) - 1)
  );

/** @type {(meta: unbuild.Meta, name: string) => unbuild.MetaVariable} */
export const mangleMetaVariable = (meta, name) =>
  /** @type {unbuild.MetaVariable} */ (
    `${META}.${apply(toString, meta, RADIX_SINGLETON)}.${name}`
  );

// /**
//  * @type {(
//  *   meta: unbuild.Meta,
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

// /**
//  * @type {<K extends string>(
//  *   meta: unbuild.Meta,
//  *   keys: K[],
//  * ) => { [key in K]: unbuild.Meta }}
//  */
// export const splitMeta = (meta, keys) =>
//   /** @type {any} */ (
//     reduceEntry(
//       mapIndex(keys.length, (index) => [
//         keys[index],
//         `${meta}${apply(toString, index, RADIX_SINGLETON)}`,
//       ]),
//     )
//   );

// /**
//  * @type {(
//  *   meta: unbuild.Meta,
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
