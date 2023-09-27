
const VAR_PREFIX = "V";
const LAB_PREFIX = "L";
const OLD_PREFIX = "O";
const NEW_PREFIX = "N";

const generateMakeVariable = (prefix) => (variable) => prefix + variable;
const generateIsVariable = (prefix) => (variable) => variable[0] === prefix;

export const makeVarVariable = generateMakeVariable(VAR_PREFIX);
export const makeLabVariable = generateMakeVariable(LAB_PREFIX);
export const makeOldVariable = generateMakeVariable(OLD_PREFIX);
export const makeNewVariable = generateMakeVariable(NEW_PREFIX);

export const isVarVariable = generateIsVariable(VAR_PREFIX);
export const isLabVariable = generateIsVariable(LAB_PREFIX);
export const isOldVariable = generateIsVariable(OLD_PREFIX);
export const isNewVariable = generateIsVariable(NEW_PREFIX);

