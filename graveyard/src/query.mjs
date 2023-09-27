import { concat } from "array-lite";
import { constant_, partialx_ } from "./util/index.mjs";
import { dispatchArrayNode0 } from "./node.mjs";

const RETURN_EMPTY = constant_([]);

export const getChildren = partialx_(dispatchArrayNode0, {
  // Program //
  ScriptProgram: ({ 1: statements }) => statements,
  ModuleProgram: ({ 1: links, 2: block }) => concat(links, [block]),
  EvalProgram: ({ 1: block }) => [block],
  // Link //
  ImportLink: RETURN_EMPTY,
  ExportLink: RETURN_EMPTY,
  AggregateLink: RETURN_EMPTY,
  Block: ({ 3: statements }) => statements,
  // Statement //
  EffectStatement: ({ 1: effect }) => [effect],
  ReturnStatement: ({ 1: expression }) => [expression],
  BreakStatement: RETURN_EMPTY,
  DebuggerStatement: RETURN_EMPTY,
  DeclareExternalStatement: ({ 3: expression }) => [expression],
  BlockStatement: ({ 1: block }) => [block],
  IfStatement: ({ 1: expression, 2: block1, 3: block2 }) => [
    expression,
    block1,
    block2,
  ],
  WhileStatement: ({ 1: expression, 2: block }) => [expression, block],
  TryStatement: ({ 1: block1, 2: block2, 3: block3 }) => [
    block1,
    block2,
    block3,
  ],
  // Effect //
  WriteEffect: ({ 2: expression }) => [expression],
  WriteExternalEffect: ({ 2: expression }) => [expression],
  ExportEffect: ({ 2: expression }) => [expression],
  ExpressionEffect: ({ 1: expression }) => [expression],
  ConditionalEffect: ({ 1: expression, 2: effects1, 3: effects2 }) =>
    concat([expression], effects1, effects2),
  // Expression //
  ParameterExpression: RETURN_EMPTY,
  LiteralExpression: RETURN_EMPTY,
  IntrinsicExpression: RETURN_EMPTY,
  ImportExpression: RETURN_EMPTY,
  ReadExpression: RETURN_EMPTY,
  ReadExternalExpression: RETURN_EMPTY,
  TypeofExternalExpression: RETURN_EMPTY,
  ClosureExpression: ({ 4: block }) => [block],
  AwaitExpression: ({ 1: expression }) => [expression],
  YieldExpression: ({ 2: expression }) => [expression],
  SequenceExpression: ({ 1: effect, 2: expression }) => [effect, expression],
  ConditionalExpression: ({
    1: expression1,
    2: expression2,
    3: expression3,
  }) => [expression1, expression2, expression3],
  EvalExpression: ({ 1: expression }) => [expression],
  ApplyExpression: ({ 1: expression1, 2: expression2, 3: expressions }) =>
    concat([expression1, expression2], expressions),
  ConstructExpression: ({ 1: expression, 2: expressions }) =>
    concat([expression], expressions),
});
