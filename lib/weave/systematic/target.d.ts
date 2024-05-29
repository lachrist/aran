import { DeepLocalContext } from "../../program";

import {
  ArgControlBlock,
  ArgEffect,
  ArgExpression,
  ArgNode,
  ArgRoutineBlock,
  ArgStatement,
  ResExpression,
} from "../atom";

export type RoutineBlockTarget = {
  origin: ArgRoutineBlock;
  parent: ArgNode;
};

export type ControlBlockTarget = {
  origin: ArgControlBlock;
  parent: ArgNode;
};

export type StatementTarget = {
  origin: ArgStatement;
  parent: ArgNode;
};

export type EffectTarget = {
  origin: ArgEffect;
  parent: ArgNode;
};

export type ExpressionTarget = {
  origin: ArgExpression;
  parent: ArgNode;
};

export type EvalExpressionTarget = {
  code: ResExpression;
  context: DeepLocalContext;
  origin: ArgExpression & { type: "EvalExpression" };
  parent: ArgNode;
};

export type ApplyExpressionTarget = {
  callee: ResExpression;
  this: ResExpression;
  arguments: ResExpression[];
  origin: ArgExpression & { type: "ApplyExpression" };
  parent: ArgNode;
};

export type ConstructExpressionTarget = {
  callee: ResExpression;
  arguments: ResExpression[];
  origin: ArgExpression & { type: "ConstructExpression" };
  parent: ArgNode;
};
