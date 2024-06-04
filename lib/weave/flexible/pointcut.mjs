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
  "block@frame": generateFilter("block@frame"),
  "block@overframe": generateFilter("block@overframe"),
  "block@before": generateFilter("block@before"),
  "block@after": generateFilter("block@after"),
  "block@failure": generateFilter("block@failure"),
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
  return {
    "block@setup": optimizePointcutType("block@setup", entries),
    "block@frame": optimizePointcutType("block@frame", entries),
    "block@overframe": optimizePointcutType("block@overframe", entries),
    "block@before": optimizePointcutType("block@before", entries),
    "block@after": optimizePointcutType("block@after", entries),
    "block@failure": optimizePointcutType("block@failure", entries),
    "block@teardown": optimizePointcutType("block@teardown", entries),
    "statement@before": optimizePointcutType("statement@before", entries),
    "statement@after": optimizePointcutType("statement@after", entries),
    "effect@before": optimizePointcutType("effect@before", entries),
    "effect@after": optimizePointcutType("effect@after", entries),
    "expression@before": optimizePointcutType("expression@before", entries),
    "expression@after": optimizePointcutType("expression@after", entries),
    "eval@before": optimizePointcutType("eval@before", entries),
    "apply@around": optimizePointcutType("apply@around", entries),
    "construct@around": optimizePointcutType("construct@around", entries),
  };
};
