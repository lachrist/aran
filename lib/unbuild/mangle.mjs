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

// To correctly represent the scope:
// this should only be accessed by lib/unbuild/scope/bindings/regular.mjs
/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseDeadzoneVariable = (variable) =>
  /** @type {unbuild.Variable} */ (`${DEADZONE}${variable}`);

// To correctly represent the scope:
// This should only be accessed by lib/unbuild/scope/bindings/regular.mjs
/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseOriginalVariable = (variable) =>
  /** @type {unbuild.Variable} */ (/** @type {string} */ (variable));

/**
 * @type {(
 *   location: __location,
 *   name: __unique,
 *   path: unbuild.Path,
 * ) => unbuild.Variable}
 */
export const mangleMetaVariable = (location, name, path) =>
  /** @type {unbuild.Variable} */ (
    `${META}${name}.${shortenLocation(location)}.${path}`
  );

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
