/** @type {(variable: estree.Variable) => unbuild.Variable} */
export const mangleBaseDeadzoneVariable = (variable) =>
  /** @type {unbuild.Variable} */ (`deadzone.${variable}`);

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
  /** @type {unbuild.Variable} */ (`aran.${description}.${kind}.${hash}`);
