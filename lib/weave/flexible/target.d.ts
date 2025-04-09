import type {
  ArgSegmentBlock,
  ArgEffect,
  ArgExpression,
  ArgNode,
  ArgProgram,
  ArgRoutineBlock,
  ArgStatement,
} from "../atom.d.ts";

export type ProgramTarget = {
  origin: ArgProgram;
  parent: null;
};

export type Target<O extends ArgNode> = {
  origin: O;
  parent: ArgNode;
};

export type RoutineBlockTarget = Target<ArgRoutineBlock>;

export type SegmentBlockTarget = Target<ArgSegmentBlock>;

export type BlockTarget = RoutineBlockTarget | SegmentBlockTarget;

export type StatementTarget = Target<ArgStatement>;

export type EffectTarget = Target<ArgEffect>;

export type ExpressionTarget = Target<ArgExpression>;

export type EvalExpressionTarget = Target<
  ArgExpression & { type: "EvalExpression" }
>;

export type ApplyExpressionTarget = Target<
  ArgExpression & { type: "ApplyExpression" }
>;

export type ConstructExpressionTarget = Target<
  ArgExpression & { type: "ConstructExpression" }
>;
