import { makeIntrinsicExpression } from "../ast/generated-make.mjs";
import { makeObjectExpression } from "../intrinsic.mjs";
import { assert } from "../util/index.mjs";
import {
  makeExternalFrame,
  makeFrameReadExpression,
  makeFrameWriteEffect,
  makeInternalFrame,
  getFrame,
  hasFrame,
} from "./frame.mjs";
import { collectFreeVariable } from "./query.mjs";
import { isNewVariable, makeLabVariable, makeVarVariable } from "./variable.mjs";





const declareVariable = (scope, variable) => {};









export const ROOT_SCOPE = null;

const makeRootScope = (prefix, entries) => ({
  parent: null,
  frame: makeExternalFrame(entries, prefix),
});

const extendScope = (parent, entries) => ({
  parent,
  frame: makeInternalFrame(entries),
});

const getBindingFrame = ({ parent, frame }, variable) => {
  if (hasFrame(frame, variable)) {
    return frame;
  } else {
    assert(parent !== null, "missing binding frame");
    return getBindingFrame(parent, variable);
  }
};

const generateLookup = (makeVariable) => (scope, variable) =>
  getFrame(getBindingFrame(scope, variable), makeVariable(variable));

export const lookupScopeLab = generateLookup(makeLabVariable);

export const lookupScopeVar = generateLookup(makeVarVariable);

export const makeScopeReadExpression = (scope, variable) =>
  makeFrameReadExpression(getBindingFrame(scope, variable), variable);

export const makeScopeWriteEffect = (scope, variable, expression) =>
  makeFrameWriteEffect(getBindingFrame(scope, variable), variable, expression);

export const makeScopeScriptProgram = () => {};

export const makeScopeBlock = (parent, labels, variables, makeStatementArray) => {
  const statements = makeStatementsArray(extendScope(parent, variables));
  const free_variable_array = flatMap(statement, collectFreeVariable);
  return makeBlock(
    labels,
    variables,
    statements,
  );
};
