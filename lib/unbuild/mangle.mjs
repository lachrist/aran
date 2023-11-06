import { getFirstZeroPrime, zip } from "../util/index.mjs";

const {
  Array,
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

export const ROOT_META = /** @type {unbuild.Meta} */ (1n);

/** @type {(meta: unbuild.Meta) => unbuild.MetaVariable} */
export const mangleMetaVariable = (meta) =>
  /** @type {unbuild.MetaVariable} */ (
    `${META}.${apply(toString, meta, RADIX_SINGLETON)}`
  );

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   meta: unbuild.Meta,
 *   length: number,
 * ) => unbuild.Meta[]}
 */
export const enumMeta = (root, length) => {
  const prime = getFirstZeroPrime(root);
  const metas = new Array(length);
  let meta = root;
  for (let index = 0; index < length; index += 1) {
    meta = /** @type {unbuild.Meta} */ (meta * prime);
    metas[index] = meta;
  }
  return metas;
};
/* eslint-enable local/no-impure */

/**
 * @type {<X>(
 *   meta: unbuild.Meta,
 *   array: X[],
 * ) => [unbuild.Meta, X][]}
 */
export const zipMeta = (meta, array) =>
  zip(enumMeta(meta, array.length), array);

/**
 * @type {<K extends string>(
 *   meta: unbuild.Meta,
 *   keys: K[],
 * ) => { [key in K]: unbuild.Meta }}
 */
export const splitMeta = (meta, keys) =>
  /** @type {any} */ (reduceEntry(zip(keys, enumMeta(meta, keys.length))));

/**
 * @type {(
 *   variable: unbuild.Variable | aran.Parameter,
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
