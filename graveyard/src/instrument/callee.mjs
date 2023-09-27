/* eslint-disable no-use-before-define */

import { flatMap, concat } from "array-lite";
import { constant__, partialx_, partial_x_ } from "../util/closure.mjs";
import { dispatchArrayNode0, dispatchArrayNode2 } from "../node.mjs";

const join = (path, segment) => `${path}_${segment}`;

const generateCollectCallee = (visitor) => (node, path, segment) =>
  dispatchArrayNode2(visitor, node, join(path, segment));

export const collectCalleeBlock = partialx_(dispatchArrayNode0, {
  Block: ({ 3: statements }) =>
    flatMap(statements, partial_x_(collectCalleeStatement, "")),
});

export const collectCalleeStatement = generateCollectCallee({
  ReturnStatement: ({ 1: expression }, path) =>
    collectCalleeExpression(expression, path, 1),
  DebuggerStatement: constant__([]),
  BreakStatement: constant__([]),
  EffectStatement: ({ 1: effect }, path) =>
    collectCalleeEffect(effect, path, 1),
  DeclareExternalStatement: ({ 3: expression }, path) =>
    collectCalleeExpression(expression, path, 3),
  BlockStatement: constant__([]),
  IfStatement: ({ 1: expression }, path) =>
    collectCalleeExpression(expression, path, 1),
  WhileStatement: ({ 1: expression }, path) =>
    collectCalleeExpression(expression, path, 1),
  TryStatement: constant__([]),
});

export const collectCalleeEffect = generateCollectCallee({
  WriteEffect: ({ 2: expression }, path) =>
    collectCalleeExpression(expression, path, 2),
  WriteExternalEffect: ({ 2: expression }, path) =>
    collectCalleeExpression(expression, path, 2),
  ExportEffect: ({ 2: expression }, path) =>
    collectCalleeExpression(expression, path, 2),
  ConditionalEffect: ({ 1: expression, 2: effects1, 3: effects2 }, path) =>
    concat(
      collectCalleeExpression(expression, path, 1),
      flatMap(effects1, partial_x_(collectCalleeEffect, join(path, 2))),
      flatMap(effects2, partial_x_(collectCalleeEffect, join(path, 3))),
    ),
  ExpressionEffect: ({ 1: expression }, path) =>
    collectCalleeExpression(expression, path, 1),
});

export const collectCalleeExpression = generateCollectCallee({
  ParameterExpression: constant__([]),
  LiteralExpression: constant__([]),
  IntersectionExpression: constant__([]),
  ImportExpression: constant__([]),
  ReadExpression: constant__([]),
  ReadExternalExpression: constant__([]),
  TypeofExternalExpression: constant__([]),
  ClosureExpression: ({}, path) => [path],
  AwaitExpression: ({ 1: expression }, path) =>
    collectCalleeExpression(expression, path, 1),
  YieldExpression: ({ 2: expression }, path) =>
    collectCalleeExpression(expression, path, 2),
  SequenceExpression: ({ 1: effect, 2: expression }, path) =>
    concat(
      collectCalleeEffect(effect, path, 1),
      collectCalleeExpression(expression, path, 2),
    ),
  ConditionalExpression: (
    { 1: expression, 2: expression1, 3: expression2 },
    path,
  ) =>
    concat(
      collectCalleeExpression(expression, path, 1),
      collectCalleeExpression(expression1, path, 2),
      collectCalleeExpression(expression2, path, 3),
    ),
  EvalExpression: ({ 1: expression }, path) =>
    collectCalleeExpression(expression, path, 1),
  ApplyExpression: ({ 1: expression1, 2: expression2, 3: expressions }, path) =>
    concat(
      collectCalleeExpression(expression1, path, 1),
      collectCalleeExpression(expression2, path, 2),
      flatMap(expressions, partial_x_(collectCalleeExpression, join(path, 3))),
    ),
  ConstructExpression: ({ 1: expression, 2: expressions }, path) =>
    concat(
      collectCalleeExpression(expression, path, 1),
      flatMap(expressions, partial_x_(collectCalleeExpression, join(path, 2))),
    ),
});
