import { listEntry, listKey, map, reduceEntry } from "../../util/index.mjs";

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
 * @type {(
 *   aspect: import("./aspect").UnknownAspect,
 * ) => import("./aspect").Pointcut}
 */
export const extractPointcut = (aspect) =>
  /** @type {any} */ (
    reduceEntry(
      map(
        /** @type {[import("../../estree").Variable, { pointcut: unknown }][]} */ (
          listEntry(aspect)
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
 * @type {(
 *   aspect: import("./aspect").UnknownAspect,
 * ) => [import("../../estree").Variable, unknown][]}
 */
export const extractAdvice = (aspect) =>
  map(
    /** @type {[import("../../estree").Variable, { advice: unknown }][]} */ (
      listEntry(aspect)
    ),
    extractAdviceEntry,
  );
