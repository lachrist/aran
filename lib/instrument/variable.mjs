/** @type {(path: string) => string} */
export const mangleCalleeVariable = (path) => `callee_${path}`;

/** @type {(parameter: Parameter | null) => string} */
export const mangleParameterVariable = (parameter) =>
  parameter === null ? "parameters" : `parameter_${parameter}`;

/** @type {(path: string) => string} */
export const mangleSerialVariable = (path) => `serial_${path}`;

export const COMPLETION_VARIABLE = "completion";
