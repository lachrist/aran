import { filterNarrow, map, isNotNull, listEntry } from "../../util/index.mjs";

/**
 * @type {<K extends import("./aspect").AspectKind>(
 *   kind: K,
 * ) => (
 *   entry: import("./aspect").PointcutEntry<
 *     import("./aspect").AspectKind,
 *   >,
 * ) => null | import("./aspect").OptimalPointcutEntry<K>}
 */
const generateFilter =
  (kind) =>
  ([advice, pointcut]) =>
    kind === pointcut.kind ? [advice, pointcut.pointcut] : null;

/**
 * @type {{ [K in import("./aspect").AspectKind]: (
 *   entry: import("./aspect").PointcutEntry<import("./aspect").AspectKind>,
 * ) => null | import("./aspect").OptimalPointcutEntry<K>}}
 */
const filter_record = {
  "block@setup": generateFilter("block@setup"),
  "block@before": generateFilter("block@before"),
  "block@declaration": generateFilter("block@declaration"),
  "block@declaration-overwrite": generateFilter("block@declaration-overwrite"),
  "control-block@after": generateFilter("control-block@after"),
  "routine-block@after": generateFilter("routine-block@after"),
  "block@throwing": generateFilter("block@throwing"),
  "block@teardown": generateFilter("block@teardown"),
  "statement@before": generateFilter("statement@before"),
  "statement@after": generateFilter("statement@after"),
  "effect@before": generateFilter("effect@before"),
  "effect@after": generateFilter("effect@after"),
  "expression@before": generateFilter("expression@before"),
  "expression@after": generateFilter("expression@after"),
  "eval@before": generateFilter("eval@before"),
  "apply@around": generateFilter("apply@around"),
  "construct@around": generateFilter("construct@around"),
};

/**
 * @type {<K extends import("./aspect").AspectKind>(
 *   kind: K,
 *   entries: import("./aspect").PointcutEntry<
 *     import("./aspect").AspectKind,
 *   >[],
 * ) => import("./aspect").OptimalPointcutEntry<K>[]}
 */
const optimizePointcutType = (kind, entries) =>
  filterNarrow(map(entries, filter_record[kind]), isNotNull);

/**
 * @type {(
 *   pointcut: import("./aspect").Pointcut,
 * ) => import("./aspect").OptimalPointcut}
 */
export const optimizePointcut = (pointcut) => {
  /**
   * @type {import("./aspect").PointcutEntry<
   *   import("./aspect").AspectKind,
   * >[]}
   */
  const entries = listEntry(pointcut);
  // Intermediates variables to resolve ts(2590):
  //   Expression produces a union type that is too complex to represent.
  const block_setup = optimizePointcutType("block@setup", entries);
  const block_declaration = optimizePointcutType("block@declaration", entries);
  const block_declaration_overwrite = optimizePointcutType(
    "block@declaration-overwrite",
    entries,
  );
  const block_before = optimizePointcutType("block@before", entries);
  const control_block_after = optimizePointcutType(
    "control-block@after",
    entries,
  );
  const routine_block_after = optimizePointcutType(
    "routine-block@after",
    entries,
  );
  const block_failure = optimizePointcutType("block@throwing", entries);
  const block_teardown = optimizePointcutType("block@teardown", entries);
  const statement_before = optimizePointcutType("statement@before", entries);
  const statement_after = optimizePointcutType("statement@after", entries);
  const effect_before = optimizePointcutType("effect@before", entries);
  const effect_after = optimizePointcutType("effect@after", entries);
  const expression_before = optimizePointcutType("expression@before", entries);
  const expression_after = optimizePointcutType("expression@after", entries);
  const eval_before = optimizePointcutType("eval@before", entries);
  const apply_around = optimizePointcutType("apply@around", entries);
  const construct_around = optimizePointcutType("construct@around", entries);
  return {
    "block@setup": block_setup,
    "block@declaration": block_declaration,
    "block@declaration-overwrite": block_declaration_overwrite,
    "block@before": block_before,
    "control-block@after": control_block_after,
    "routine-block@after": routine_block_after,
    "block@throwing": block_failure,
    "block@teardown": block_teardown,
    "statement@before": statement_before,
    "statement@after": statement_after,
    "effect@before": effect_before,
    "effect@after": effect_after,
    "expression@before": expression_before,
    "expression@after": expression_after,
    "eval@before": eval_before,
    "apply@around": apply_around,
    "construct@around": construct_around,
  };
};
