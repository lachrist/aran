import { Pointcut } from "../../../type/advice";
import {
  ArgControlBlock,
  ArgEffect,
  ArgExpression,
  ArgRoutineBlock,
  ArgStatement,
} from "../atom";

export type BlockPointcut = Pointcut<Json[], ArgControlBlock | ArgRoutineBlock>;

export type StatementPointcut = Pointcut<Json[], ArgStatement>;

export type EffectPointcut = Pointcut<Json[], ArgEffect>;

export type ExpressionPointcut = Pointcut<Json[], ArgExpression>;

export type EvalExpressionPointcut = Pointcut<
  Json[],
  ArgExpression & { type: "EvalExpression" }
>;

export type ApplyExpressionPointcut = Pointcut<
  Json[],
  ArgExpression & { type: "ApplyExpression" }
>;

export type ConstructExpressionPointcut = Pointcut<
  Json[],
  ArgExpression & { type: "ConstructExpression" }
>;

export type AspectPointcut = {
  "block@setup": [estree.Variable, BlockPointcut][];
  "block@frame": [estree.Variable, BlockPointcut][];
  "block@overframe": [estree.Variable, BlockPointcut][];
  "block@before": [estree.Variable, BlockPointcut][];
  "block@after": [estree.Variable, BlockPointcut][];
  "block@failure": [estree.Variable, BlockPointcut][];
  "block@teardown": [estree.Variable, BlockPointcut][];
  "statement@before": [estree.Variable, StatementPointcut][];
  "statement@after": [estree.Variable, StatementPointcut][];
  "effect@before": [estree.Variable, EffectPointcut][];
  "effect@after": [estree.Variable, EffectPointcut][];
  "expression@before": [estree.Variable, ExpressionPointcut][];
  "expression@after": [estree.Variable, ExpressionPointcut][];
  "eval@before": [estree.Variable, EvalExpressionPointcut][];
  "apply@around": [estree.Variable, ApplyExpressionPointcut][];
  "construct@around": [estree.Variable, ConstructExpressionPointcut][];
};
