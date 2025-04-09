import type { BinaryOperator, LogicalOperator } from "estree-sentry";
import type { Expression } from "./atom.d.ts";

export type Assigner = {
  result: "old" | "new" | "discard";
  operator: BinaryOperator | LogicalOperator;
  increment: Expression | null;
};

export type ExpressionAssigner = Assigner & { result: "old" | "new" };

export type EffectAssigner = Assigner & { result: "discard" };
