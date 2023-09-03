export const ADVICE_VARIABLE = /** @type {Variable} */ ("advice");

export const COMPLETION_VARIABLE = /** @type {Variable} */ ("completion");

/** @type {(path: string) => Variable} */
export const mangleCalleeVariable = (path) =>
  /** @type {Variable} */ (`callee_${path}`);

/** @type {(parameter: Parameter | null) => Variable} */
export const mangleParameterVariable = (parameter) =>
  /** @type {Variable} */ (
    parameter === null ? "parameters" : `parameter_${parameter}`
  );

/** @type {(path: string) => Variable} */
export const mangleSerialVariable = (path) =>
  /** @type {Variable} */ (`serial_${path}`);

/** @type {(label: Label) => Variable} */
export const mangleLabelVariable = (label) =>
  /** @type {Variable} */ (`label_${label}`);

/** @type {(variable: Variable) => Variable} */
export const mangleShadowVariable = (variable) =>
  /** @type {Variable} */ (`shadow_${variable}`);

/** @type {(variable: Variable) => Variable} */
export const mangleOriginalVariable = (variable) =>
  /** @type {Variable} */ (`original_${variable}`);
