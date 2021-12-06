const {
  Reflect: {apply},
  String: {
    prototype: {substring},
  },
} = globalThis;

export const BASE_HEAD = "$";
export const META_HEAD = "_";

const generateIsVariable = (head) => (variable) => variable[0] === head;
export const isBaseVariable = generateIsVariable(BASE_HEAD);
export const isMetaVariable = generateIsVariable(META_HEAD);

export const getVariableBody = (variable) => apply(substring, variable, [1]);

const generateMakeVariable = (head) => (body) => `${head}${body}`;
export const makeBaseVariable = generateMakeVariable(BASE_HEAD);
export const makeMetaVariable = generateMakeVariable(META_HEAD);
