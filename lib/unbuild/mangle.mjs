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
 *   hash: unbuild.Hash,
 *   basename: string,
 *   description: string,
 * ) => unbuild.Variable}
 */
export const mangleMetaVariable = (hash, basename, description) =>
  /** @type {unbuild.Variable} */ (`${META}${description}.${basename}.${hash}`);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isBaseDeadzoneVariable = (variable) =>
  apply(startsWith, variable, DEADZONE_SINGLETON);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isMetaVariable = (variable) =>
  apply(startsWith, variable, META_SINGLETON);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isBaseOriginalVariable = (variable) =>
  !isBaseDeadzoneVariable(variable) && !isMetaVariable(variable);

/** @type {(label: unbuild.Hash) => unbuild.Label}  */
export const mangleEmptyBreakLabel = (hash) =>
  /** @type {unbuild.Label} */ (`break.loop.${hash}`);

/** @type {(label: estree.Label) => unbuild.Label}  */
export const mangleBreakLabel = (label) =>
  /** @type {unbuild.Label} */ (`break.${label}`);

/** @type {(label: unbuild.Hash) => unbuild.Label}  */
export const mangleEmptyContinueLabel = (hash) =>
  /** @type {unbuild.Label} */ (`continue.loop.${hash}`);

/** @type {(label: estree.Label) => unbuild.Label}  */
export const mangleContinueLabel = (label) =>
  /** @type {unbuild.Label} */ (
    label === null ? "continue" : `continue.${label}`
  );
