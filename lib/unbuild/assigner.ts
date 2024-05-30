import { Atom } from "./atom";

export type Assigner = {
  result: "old" | "new" | "discard";
  operator: estree.BinaryOperator | estree.LogicalOperator;
  increment: aran.Expression<Atom> | null;
};

export type ExpressionAssigner = Assigner & { result: "old" | "new" };

export type EffectAssigner = Assigner & { result: "discard" };
