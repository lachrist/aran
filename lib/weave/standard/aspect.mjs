import { listEntry, listKey, map, reduceEntry } from "../../util/index.mjs";
import { extractAdviceEntry, extractPointcutEntry } from "../extract.mjs";

/**
 * @type {{ [key in import("./aspect").AspectKind]: null }}
 */
const record = {
  "block@setup": null,
  "block@frame": null,
  "block@overframe": null,
  "block@success": null,
  "block@failure": null,
  "block@teardown": null,
  "break@before": null,
  "test@before": null,
  "intrinsic@after": null,
  "primitive@after": null,
  "import@after": null,
  "closure@after": null,
  "read@after": null,
  "eval@before": null,
  "eval@after": null,
  "await@before": null,
  "await@after": null,
  "yield@before": null,
  "yield@after": null,
  "drop@before": null,
  "export@before": null,
  "write@before": null,
  "return@before": null,
  "apply@around": null,
  "construct@around": null,
};

export const aspect_kind_enumeration = listKey(record);

/**
 * @type {(
 *   aspect: import("./aspect").UnknownAspect,
 * ) => import("./aspect").ObjectPointcut}
 */
export const extractPointcut = (aspect) =>
  /** @type {any} */ (
    reduceEntry(
      map(
        /** @type {[string, {pointcut: unknown}][]} */ (listEntry(aspect)),
        extractPointcutEntry,
      ),
    )
  );

/**
 * @type {(
 *   aspect: import("./aspect").UnknownAspect,
 * ) => unknown}
 */
export const extractAdvice = (aspect) =>
  reduceEntry(
    map(
      /** @type {[string, {advice: unknown}][]} */ (listEntry(aspect)),
      extractAdviceEntry,
    ),
  );
