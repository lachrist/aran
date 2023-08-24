/** @type {(variable: string) => string} */
export const mangleVarVariable = (variable) => `v${variable}`;

/** @type {(label: string | null) => string} */
export const mangleLabVariable = (label) => `l${label === null ? "" : label}`;

/** @type {(variable: string) => string} */
export const mangleOldVariable = (variable) => `o${variable}`;

/** @type {(path: string, name: string) => string} */
export const mangleNewVariable = (path, name) => `n${path}_${name}`;

/** @type {(parameter: Parameter | null) => string} */
export const mangleArgVariable = (parameter) =>
  `p${parameter === null ? "" : parameter}`;

/** @type {(variable: string) => boolean} */
export const isNewVariable = (variable) => variable[0] === "n";
