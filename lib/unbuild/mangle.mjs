import { shortenLocation } from "./location.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

const DEADZONE = "deadzone.";

const META = "aran.";

const DEADZONE_SINGLETON = [DEADZONE];

const META_SINGLETON = [META];

// To enforce the scope abstraction:
// this should only be accessed by lib/unbuild/scope/bindings/regular.mjs
/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseDeadzoneVariable = (variable) =>
  /** @type {unbuild.Variable} */ (`${DEADZONE}${variable}`);

// To enforce the scope abstraction:
// This should only be accessed by lib/unbuild/scope/bindings/regular.mjs
/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseOriginalVariable = (variable) =>
  /** @type {unbuild.Variable} */ (/** @type {string} */ (variable));

// /**
//  * @type {(
//  *   root: unbuild.Path | unbuild.Namespace,
//  *   location: __location,
//  *   unique: __unique,
//  * ) => unbuild.Namespace}
// */
// export const mangleNamespace = (root, location, unique) => `${root}.${location}.${unique}`;

// /**
//  * @type {(
//  *   namespace: unbuild.Namespace,
//  * ) => unbuild.Variable}
//  */
// export const mangleMetaVariable = (namespace) => `${META}${namespace}`;

/**
 * @type {(location: __location, unique: __unique) => unbuild.Fragment}
 */
export const makeFragment = (location, unique) =>
  /** @type {unbuild.Fragment} */ (`${shortenLocation(location)}.${unique}`);

/**
 * @type {(
 *   fragment: unbuild.Fragment,
 *   location: __location,
 *   unique: __unique,
 * ) => unbuild.Fragment}
 */
export const extendFragment = (fragment, location, unique) =>
  /** @type {unbuild.Fragment} */ (
    `${fragment}.${shortenLocation(location)}.${unique}`
  );

/**
 * @type {(
 *   path: unbuild.Path,
 *   fragment: unbuild.Fragment,
 * ) => unbuild.Variable}
 */
export const mangleMetaVariable = (path, fragment) =>
  /** @type {unbuild.Variable} */ (`${META}${path}.${fragment}`);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isBaseDeadzoneVariable = (variable) =>
  apply(startsWith, variable, DEADZONE_SINGLETON);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isMetaVariable = (variable) =>
  apply(startsWith, variable, META_SINGLETON);

/** @type {(variable: unbuild.Variable) => boolean} */
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
