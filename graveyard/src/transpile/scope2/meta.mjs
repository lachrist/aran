import {
  makeWriteEffect,
  makeReadExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/generated-make.mjs";

export const mangleMetaVariable = (program, node, info) => {};

export const makeMetaInitializeEffect = (dynamic, meta, expression) => {};

export const makeMetaInitializeEffect = (meta, expression) =>
  makeWriteEffect(meta, expression, meta);

export const makeMetaWriteEffect = makeWriteEffect;

export const makeMetaReadExpression = makeReadExpression;

export const listMetaVariable = (statements) => [];

export const makeMetaDynamicDeclareStatement = (meta) =>
  makeEffectStatement(makeExpressionEffect());


const make
