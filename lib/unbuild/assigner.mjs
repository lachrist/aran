/**
 * @type {(
 *   result: "discard",
 *   operator: estree.BinaryOperator | estree.LogicalOperator,
 *   increment: aran.Expression<import("./atom").Atom> | null,
 * ) => import("./assigner").EffectAssigner }
 */
export const makeEffectAssigner = (result, operator, increment) => ({
  result,
  operator,
  increment,
});

/**
 * @type {(
 *   result: "old" | "new",
 *   operator: estree.BinaryOperator | estree.LogicalOperator,
 *   increment: aran.Expression<import("./atom").Atom> | null,
 * ) => import("./assigner").ExpressionAssigner }
 */
export const makeExpressionAssigner = (result, operator, increment) => ({
  result,
  operator,
  increment,
});
