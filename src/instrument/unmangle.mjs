import {isMetaVariable, getVariableBody} from "../variable.mjs";

import {isEmptyLabel, isBreakLabel, getLabelBody} from "../label.mjs";

export const unmangleVariable = (variable) => ({
  kind: isMetaVariable(variable) ? "meta" : "base",
  name: getVariableBody(variable),
  identifier: variable,
});

export const unmangleLabel = (label) => ({
  kind: isBreakLabel(label) ? "break" : "continue",
  name: isEmptyLabel(label) ? null : getLabelBody(label),
  identifier: label,
});
