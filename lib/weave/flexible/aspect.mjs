import {
  filterNarrow,
  get0,
  listEntry,
  listKey,
  map,
  recordArray,
} from "../../util/index.mjs";

/**
 * @type {{ [K in import("./aspect").AspectKind]: null }}
 */
const record = {
  "block@setup": null,
  "block@declaration": null,
  "block@declaration-overwrite": null,
  "block@before": null,
  "program-block@after": null,
  "closure-block@after": null,
  "segment-block@after": null,
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
 * ) => V}
 */
export const getPointcut = ([_key, { pointcut }]) => pointcut;

/**
 * @type {<K, V>(
 *   entry: [K, V],
 * ) => entry is [K, Exclude<V, null | undefined>]}
 */
const isNotNullishEntry = (entry) => entry[1] != null;

/**
 * @type {<atom extends import("../../lang/syntax").Atom, state, value>(
 *   aspect: import("./aspect").Aspect<atom, state, value>,
 * ) => import("./aspect").Pointcut<atom>}
 */
export const extractPointcut = (aspect) =>
  /** @type {any} */ (
    recordArray(
      /** @type {[string, { pointcut: unknown }][]} */ (
        filterNarrow(listEntry(aspect), isNotNullishEntry)
      ),
      get0,
      getPointcut,
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
 * @type {<atom extends import("../../lang/syntax").Atom, state, value>(
 *   aspect: import("./aspect").Aspect<atom, state, value>,
 * ) => [string, unknown][]}
 */
export const extractAdvice = (aspect) =>
  map(
    /** @type {[string, { advice: unknown }][]} */ (
      filterNarrow(listEntry(aspect), isNotNullishEntry)
    ),
    extractAdviceEntry,
  );
