import { setErrorMessage } from "./error.mjs";
import {
  hasMappingError,
  getMappingError,
  makeEmptyMapping,
  makeSingleMapping,
  combineMapping,
  bindMapping,
} from "./mapping.mjs";

export const getResultError = (result) => {
  if (result.structural !== null) {
    return result.structural;
  } else if (hasMappingError(result.label)) {
    return getMappingError(result.label);
  } else if (hasMappingError(result.variable)) {
    return getMappingError(result.variable);
  } else {
    return null;
  }
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

export const combineResult = (result1, result2, error) => ({
  variable: combineMapping(
    result1.variable,
    result2.variable,
    setErrorMessage(error, "Variable combination mismatch"),
  ),
  label: combineMapping(
    result1.label,
    result2.label,
    setErrorMessage(error, "Label combination mismatch"),
  ),
  structural:
    result1.structural === null ? result2.structural : result1.structural,
});

export const bindResultVariable = (result, variable1, variable2, error) => ({
  variable: bindMapping(
    result.variable,
    variable1,
    variable2,
    setErrorMessage(error, "Variable binding mismatch"),
  ),
  label: result.label,
  structural: result.structural,
});

export const bindResultLabel = (result, label1, label2, error) => ({
  variable: result.variable,
  label: bindMapping(
    result.label,
    label1,
    label2,
    setErrorMessage(error, "Label binding mismatch"),
  ),
  structural: result.structural,
});
