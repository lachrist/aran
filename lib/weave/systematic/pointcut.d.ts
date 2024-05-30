import { Pointcut } from "./advice";
import {
  ArgControlBlock,
  ArgEffect,
  ArgExpression,
  ArgRoutineBlock,
  ArgStatement,
} from "../atom";
import { Variable } from "../../estree";
import { Json } from "../../json";

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
  "block@setup": [Variable, BlockPointcut][];
  "block@frame": [Variable, BlockPointcut][];
  "block@overframe": [Variable, BlockPointcut][];
  "block@before": [Variable, BlockPointcut][];
  "block@after": [Variable, BlockPointcut][];
  "block@failure": [Variable, BlockPointcut][];
  "block@teardown": [Variable, BlockPointcut][];
  "statement@before": [Variable, StatementPointcut][];
  "statement@after": [Variable, StatementPointcut][];
  "effect@before": [Variable, EffectPointcut][];
  "effect@after": [Variable, EffectPointcut][];
  "expression@before": [Variable, ExpressionPointcut][];
  "expression@after": [Variable, ExpressionPointcut][];
  "eval@before": [Variable, EvalExpressionPointcut][];
  "apply@around": [Variable, ApplyExpressionPointcut][];
  "construct@around": [Variable, ConstructExpressionPointcut][];
};
