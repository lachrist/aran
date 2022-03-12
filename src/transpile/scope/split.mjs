import {
  makeMetaVariable,
  makeBaseVariable,
  getVariableBody,
} from "../../variable.mjs";

import {
  declareVariable,
  declareFreshVariable,
  declareGhostVariable,
  annotateVariable,
  makeInitializeEffect,
  makeLookupEffect,
  makeLookupExpression,
} from "./core.mjs";

export {
  makeRootScope,
  makeClosureScope,
  makePropertyScope,
  makeDynamicScope,
  makeScopeBlock,
  lookupScopeProperty,
  makeScopeEvalExpression,
} from "./core.mjs";

/////////////
// Declare //
/////////////

const generateGenerateDeclare =
  (makeVariable) => (closure) => (scope, variable) => {
    const either = closure(scope, makeVariable(variable));
    return typeof either === "string" ? getVariableBody(either) : either;
  };

const generateDeclareMeta = generateGenerateDeclare(makeMetaVariable);
const generateDeclareBase = generateGenerateDeclare(makeBaseVariable);

export const declareMetaVariable = generateDeclareMeta(declareFreshVariable);
export const declareBaseVariable = generateDeclareBase(declareVariable);
export const declareGhostBaseVariable =
  generateDeclareBase(declareGhostVariable);

////////////
// Others //
////////////

const generateGenerate =
  (makeVariable) => (closure) => (scope, variable, argument) =>
    closure(scope, makeVariable(variable), argument);
const generateBase = generateGenerate(makeBaseVariable);
const generateMeta = generateGenerate(makeMetaVariable);

export const annotateBaseVariable = generateBase(annotateVariable);

export const makeBaseInitializeEffect = generateBase(makeInitializeEffect);
export const makeMetaInitializeEffect = generateMeta(makeInitializeEffect);

export const makeBaseLookupEffect = generateBase(makeLookupEffect);
export const makeMetaLookupEffect = generateMeta(makeLookupEffect);

export const makeBaseLookupExpression = generateBase(makeLookupExpression);
export const makeMetaLookupExpression = generateMeta(makeLookupExpression);
