import {makeMetaVariable, makeBaseVariable} from "../../variable.mjs";

import {
  declareVariable,
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

const generateGenerate =
  (makeVariable) => (closure) => (scope, variable, argument) =>
    closure(scope, makeVariable(variable), argument);
const generateBase = generateGenerate(makeBaseVariable);
const generateMeta = generateGenerate(makeMetaVariable);

export const declareBaseVariable = generateBase(declareVariable);
export const declareMetaVariable = generateMeta(declareVariable);

export const declareBaseGhostVariable = generateBase(declareGhostVariable);
export const declareMetaGhostVariable = generateMeta(declareGhostVariable);

export const annotateBaseVariable = generateBase(annotateVariable);
export const annotateMetaVariable = generateMeta(annotateVariable);

export const makeBaseInitialieEffect = generateBase(makeInitializeEffect);
export const makeMetaInitialieEffect = generateMeta(makeInitializeEffect);

export const makeBaseLookupEffect = generateBase(makeLookupEffect);
export const makeMetaLookupEffect = generateMeta(makeLookupEffect);

export const makeBaseLookupExpression = generateBase(makeLookupExpression);
export const makeMetaLookupExpression = generateMeta(makeLookupExpression);
