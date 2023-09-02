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

export const COMPLETION_VARIABLE = /** @type {Variable} */ ("completion");
