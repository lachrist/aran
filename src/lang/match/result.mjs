import {
  makeEmptyMapping,
  makeSingleMapping,
  combineMapping,
  bindMapping,
} from "./mapping.mjs";

const {JSON:{stringify: stringifyJSON}} = globalThis;

export const getResultErrorMessage = (result) => {
  if (typeof result.variable === "string") {
    return result.variable;
  }
  if (typeof result.label === "string") {
    return result.label;
  }
  if (result.structural !== null) {
    return result.structural;
  }
  return null;
};

export const makeEmptyResult = () => ({
  variable: makeEmptyMapping(),
  label: makeEmptyMapping(),
  structural: null,
});

export const makeStructuralMismatchResult = (path, json1, json2) => ({
  variable: makeEmptyMapping(),
  label: makeEmptyMapping(),
  structural: `Structural mismatch at ${path} between ${stringifyJSON(json1)} and ${stringifyJSON(json2)}`,
});

export const makeSingleVariableResult = (variable1, variable2) => ({
  variable: makeSingleMapping(variable1, variable2),
  label: makeEmptyMapping(),
  structural: null,
});

export const makeSingleLabelResult = (label1, label2) => ({
  variable: makeEmptyMapping(),
  label: makeSingleMapping(label1, label2),
  structural: null,
});

export const combineResult = (path, result1, result2) => ({
  variable: combineMapping(path, result1.variable, result2.variable),
  label: combineMapping(path, result1.label, result2.label),
  structural:
    result1.structural === null ? result2.structural : result1.structural,
});

export const bindResultVariable = (path, variable1, variable2, result) => ({
  variable: bindMapping(path, variable1, variable2, result.variable),
  label: result.label,
  structural: result.structural,
});

export const bindResultLabel = (path, label1, label2, result) => ({
  variable: result.variable,
  label: bindMapping(path, label1, label2, result.label),
  structural: result.structural,
});
