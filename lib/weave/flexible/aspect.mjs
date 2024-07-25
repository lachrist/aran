import {
  filterNarrow,
  listEntry,
  listKey,
  map,
  reduceEntry,
} from "../../util/index.mjs";

/**
 * @type {{ [K in import("./aspect").AspectKind]: null }}
 */
const record = {
  "block@setup": null,
  "block@declaration": null,
  "block@declaration-overwrite": null,
  "block@before": null,
  "control-block@after": null,
  "routine-block@after": null,
  "block@throwing": null,
  "block@teardown": null,
  "statement@before": null,
  "statement@after": null,
  "effect@before": null,
  "effect@after": null,
  "expression@before": null,
  "expression@after": null,
  "eval@before": null,
  "apply@around": null,
  "construct@around": null,
};

export const aspect_kind_enumeration = listKey(record);

/**
 * @type {<K, V>(
 *   entry: [
 *     K,
 *     { pointcut: V },
 *   ],
 * ) => [K, V]}
 */
export const extractPointcutEntry = ([key, { pointcut }]) => [key, pointcut];

/**
 * @type {<K, V>(
 *   entry: [K, V],
 * ) => entry is [K, Exclude<V, null | undefined>]}
 */
const isNotNullishEntry = (entry) => entry[1] != null;

/**
 * @type {<state, value>(
 *   aspect: import("./aspect").Aspect<state, value>,
 * ) => import("./aspect").Pointcut}
 */
export const extractPointcut = (aspect) =>
  /** @type {any} */ (
    reduceEntry(
      map(
        /** @type {[string, { pointcut: unknown }][]} */ (
          filterNarrow(listEntry(aspect), isNotNullishEntry)
        ),
        extractPointcutEntry,
      ),
    )
  );

/**
 * @type {<K, V>(
 *   entry: [
 *     K,
 *     { advice: V },
 *   ],
 * ) => [K, V]}
 */
export const extractAdviceEntry = ([key, { advice }]) => [key, advice];

/**
 * @type {<state, value>(
 *   aspect: import("./aspect").Aspect<state, value>,
 * ) => [string, unknown][]}
 */
export const extractAdvice = (aspect) =>
  map(
    /** @type {[string, { advice: unknown }][]} */ (
      filterNarrow(listEntry(aspect), isNotNullishEntry)
    ),
    extractAdviceEntry,
  );
