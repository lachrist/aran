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
 *   kind:
 *     | "pattern"
 *     | "expression"
 *     | "effect"
 *     | "statement"
 *     | "update_expression"
 *     | "update_effect"
 *     ,
 *   description: string,
 * ) => unbuild.Variable}
 */
export const mangleMetaVariable = (hash, kind, description) =>
  /** @type {unbuild.Variable} */ (`${META}${description}.${kind}.${hash}`);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isBaseDeadzoneVariable = (variable) =>
  apply(startsWith, variable, DEADZONE_SINGLETON);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isMetaVariable = (variable) =>
  apply(startsWith, variable, META_SINGLETON);

/** @type {(variable: unbuild.Variable) => boolean} */
export const isBaseOriginalVariable = (variable) =>
  !isBaseDeadzoneVariable(variable) && !isMetaVariable(variable);
