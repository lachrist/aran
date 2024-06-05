import { listEntry, listKey, map, reduceEntry } from "../../util/index.mjs";
import { extractAdviceEntry, extractPointcutEntry } from "../extract.mjs";

/**
 * @type {{ [K in import("./aspect").AspectKind]: null }}
 */
const record = {
  "block@setup": null,
  "block@frame": null,
  "block@overframe": null,
  "block@before": null,
  "block@after": null,
  "block@failure": null,
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
