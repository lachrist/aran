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

/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseDeadzoneVariable = (variable) =>
  /** @type {unbuild.Variable} */ (`${DEADZONE}${variable}`);

/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseOriginalVariable = (variable) =>
  /** @type {unbuild.Variable} */ (/** @type {string} */ (variable));

/**
 * @type {(
 *   hash: string,
 *   kind: string,
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
