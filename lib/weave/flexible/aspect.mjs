import { listKey } from "../../util/index.mjs";

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
