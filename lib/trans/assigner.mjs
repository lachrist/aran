/**
 * @type {(
 *   result: "discard",
 *   operator: (
 *     | import("estree-sentry").BinaryOperator
 *     | import("estree-sentry").LogicalOperator
 *   ),
 *   increment: import("./atom.d.ts").Expression | null,
 * ) => import("./assigner.d.ts").EffectAssigner }
 */
export const makeEffectAssigner = (result, operator, increment) => ({
  result,
  operator,
  increment,
});

/**
 * @type {(
 *   result: "old" | "new",
 *   operator: (
 *     | import("estree-sentry").BinaryOperator
 *     | import("estree-sentry").LogicalOperator
 *   ),
 *   increment: import("./atom.d.ts").Expression | null,
 * ) => import("./assigner.d.ts").ExpressionAssigner }
 */
export const makeExpressionAssigner = (result, operator, increment) => ({
  result,
  operator,
  increment,
});
