import { listKey } from "../../util/index.mjs";

/**
 * @type {{ [key in import("./aspect").AspectKind]: null }}
 */
const record = {
  "program-block@setup": null,
  "closure-block@setup": null,
  "segment-block@setup": null,
  "program-block@before": null,
  "closure-block@before": null,
  "segment-block@before": null,
  "block@declaration": null,
  "block@declaration-overwrite": null,
  "generator-block@suspension": null,
  "generator-block@resumption": null,
  "program-block@after": null,
  "closure-block@after": null,
  "segment-block@after": null,
  "block@throwing": null,
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
  "apply@around": null,
  "construct@around": null,
};

export const aspect_kind_enumeration = listKey(record);
