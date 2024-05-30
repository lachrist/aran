import { BinaryOperator, LogicalOperator } from "../estree";
import { Expression } from "./atom";

export type Assigner = {
  result: "old" | "new" | "discard";
  operator: BinaryOperator | LogicalOperator;
  increment: Expression | null;
};

export type ExpressionAssigner = Assigner & { result: "old" | "new" };

export type EffectAssigner = Assigner & { result: "discard" };
