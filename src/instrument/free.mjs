/* eslint-disable no-use-before-define */

import { includes, some } from "array-lite";
import {
  partialx___,
  constant__,
  partialx__,
  partial_x,
} from "../util/index.mjs";
import { dispatchArrayNode1 } from "../node.mjs";

const cache = new WeakMap();

export const hasBlockFreeVariable = partialx___(dispatchArrayNode1, {
  Block: ({ 2: variables, 3: statements }, target) => {
    if (includes(variables, target.variable)) {
      return false;
    } else {
      return some(statements, partial_x(hasStatementFreeVariable, target));
    }
  },
});

export const hasStatementFreeVariable = partialx__(dispatchArrayNode1, {
  ReturnStatement: ({ 1: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
  DebuggerStatement: constant__(false),
  BreakStatement: constant__(false),
  EffectStatement: ({ 1: effect }, target) =>
    hasEffectFreeVariable(effect, target),
  DeclareExternalStatement: ({ 3: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
  BlockStatement: ({ 1: block }, target) => hasBlockFreeVariable(block, target),
  IfStatement: ({ 1: expression, 2: block1, 3: block2 }, target) =>
    hasExpressionFreeVariable(expression, target) ||
    hasBlockFreeVariable(block1, target) ||
    hasBlockFreeVariable(block2, target),
  WhileStatement: ({ 1: expression, 2: block }, target) =>
    hasExpressionFreeVariable(expression, target) ||
    hasBlockFreeVariable(block, target),
  TryStatement: ({ 1: block1, 2: block2, 3: block3 }, target) =>
    hasBlockFreeVariable(block1, target) ||
    hasBlockFreeVariable(block2, target) ||
    hasBlockFreeVariable(block3, target),
});

export const hasEffectFreeVariable = partialx__(dispatchArrayNode1, {
  WriteEffect: ({ 1: variable, 2: expression }, target) =>
    (target.internal && target.variable === variable) ||
    hasExpressionFreeVariable(expression, target),
  WriteExternalEffect: ({ 1: variable, 2: expression }, target) =>
    (!target.internal && target.variable === variable) ||
    hasExpressionFreeVariable(expression, target),
  ExportEffect: ({ 2: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
  ConditionalEffect: ({ 1: expression, 2: effects1, 3: effects2 }, target) =>
    hasExpressionFreeVariable(expression, target) ||
    some(effects1, partial_x(hasEffectFreeVariable, target)) ||
    some(effects2, partial_x(hasEffectFreeVariable, target)),
  ExpressionEffect: ({ 1: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
});

export const hasExpressionFreeVariable = partialx__(dispatchArrayNode1, {
  ParameterExpression: constant__(false),
  LiteralExpression: constant__(false),
  IntrinsicExpression: constant__(false),
  ImportExpression: constant__(false),
  ReadExpression: ({ 1: variable }, target) =>
    target.internal && target.variable === variable,
  ReadExternalExpression: ({ 1: variable }, target) =>
    !target.internal && target.variable === variable,
  TypeofExternalExpression: ({ 1: variable }, target) =>
    !target.internal && target.variable === variable,
  ClosureExpression: ({ 4: block }, target) =>
    hasBlockFreeVariable(block, target),
  AwaitExpression: ({ 1: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
  YieldExpression: ({ 2: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
  SequenceExpression: ({ 1: effect, 2: expression }, target) =>
    hasEffectFreeVariable(effect, target) ||
    hasExpressionFreeVariable(expression, target),
  ConditionalExpression: (
    { 1: expression1, 2: expression2, 3: expression3 },
    target,
  ) =>
    hasExpressionFreeVariable(expression1, target) ||
    hasExpressionFreeVariable(expression2, target) ||
    hasExpressionFreeVariable(expression3, target),
  EvalExpression: ({ 1: expression }, target) =>
    hasExpressionFreeVariable(expression, target),
  ApplyExpression: (
    { 1: expression1, 2: expression2, 3: expressions },
    target,
  ) =>
    hasExpressionFreeVariable(expression1, target) ||
    hasExpressionFreeVariable(expression2, target) ||
    some(expressions, partial_x(hasExpressionFreeVariable, target)),
  ConstructExpression: ({ 1: expression, 2: expressions }, target) =>
    hasExpressionFreeVariable(expression, target) ||
    some(expressions, partial_x(hasExpressionFreeVariable, target)),
});
