const VAR_HEAD = "V";
const LAB_HEAD = "L";
const OLD_HEAD = "O";
const NEW_HEAD = "N";
const REC_HEAD = "R";
const WEC_HEAD = "W";
const TEC_HEAD = "T";

const generateMakeVariable = (head) => (body) => `${head}${body}`;
export const makeVarVariable = generateMakeVariable(VAR_HEAD);
export const makeLabVariable = generateMakeVariable(LAB_HEAD);
export const makeOldVariable = generateMakeVariable(OLD_HEAD);
export const makeNewVariable = generateMakeVariable(NEW_HEAD);
export const makeRECVariable = generateMakeVariable(REC_HEAD);
export const makeWECVariable = generateMakeVariable(WEC_HEAD);
export const makeTECVariable = generateMakeVariable(TEC_HEAD);

const generateIsVariable = (head) => (variable) => variable[0] === head;
export const isVarVariable = generateIsVariable(VAR_HEAD);
export const isLabVariable = generateIsVariable(LAB_HEAD);
export const isOldVariable = generateIsVariable(OLD_HEAD);
export const isNewVariable = generateIsVariable(NEW_HEAD);
export const isRECVariable = generateIsVariable(REC_HEAD);
export const isWECVariable = generateIsVariable(WEC_HEAD);
export const isTECVariable = generateIsVariable(TEC_HEAD);
