/** @type {(variable: string) => string} */
export const mangleVariableVariable = (variable) => `var_${variable}`;

/** @type {(label: string | null) => string} */
export const mangleLabelVariable = (label) => `lab_${label}`;

/** @type {(path: string) => string} */
export const mangleCalleeVariable = (path) => `cll_${path}`;

/** @type {(path: string) => string} */
export const mangleSerialVariable = (path) => `ser_${path}`;

/** @type {(parameter: Parameter | null) => string} */
export const mangleParameterVariable = (parameter) =>
  `prm_${parameter === null ? "" : parameter}`;
