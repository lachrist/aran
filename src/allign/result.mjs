import { setErrorMessage } from "./error.mjs";
import {
  isMapping,
  makeEmptyMapping,
  makeSingleMapping,
  combineMapping,
  bindMapping,
} from "./mapping.mjs";

export const getResultError = (result) => {
  if (result.structural !== null) {
    return result.structural;
  }
  if (!isMapping(result.label)) {
    return result.label;
  }
  if (!isMapping(result.variable)) {
    return result.variable;
  }
  return null;
};

export const makeEmptyResult = (error) => ({
  variable: makeEmptyMapping(),
  label: makeEmptyMapping(),
  structural: error,
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

export const combineResult = (error, result1, result2) => ({
  variable: combineMapping(
    setErrorMessage(error, "Variable combination mismatch"),
    result1.variable,
    result2.variable,
  ),
  label: combineMapping(
    setErrorMessage(error, "Label combination mismatch"),
    result1.label,
    result2.label,
  ),
  structural:
    result1.structural === null ? result2.structural : result1.structural,
});

export const bindResultVariable = (error, variable1, variable2, result) => ({
  variable: bindMapping(
    setErrorMessage(error, "Variable binding mismatch"),
    variable1,
    variable2,
    result.variable,
  ),
  label: result.label,
  structural: result.structural,
});

export const bindResultLabel = (error, label1, label2, result) => ({
  variable: result.variable,
  label: bindMapping(
    setErrorMessage(error, "Label binding mismatch"),
    label1,
    label2,
    result.label,
  ),
  structural: result.structural,
});
