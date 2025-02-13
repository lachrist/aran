const {
  Object: { keys, hasOwn },
} = globalThis;

/** @type {{[key in import("./stage-name").StageName]: null}} */
export const stage_name_record = {
  "bare-comp": null,
  "bare-main": null,
  "count-branch": null,
  "flex-full": null,
  "flex-void": null,
  "identity": null,
  "invariant": null,
  "parsing": null,
  "stnd-full": null,
  "stnd-void": null,
  "trace": null,
  "track-origin": null,
  "linvail/stage-cust-main": null,
  "linvail/stage-cust-comp": null,
  "linvail/stage-stnd-main": null,
  "linvail/stage-stnd-comp": null,
  "tree-size/count/main": null,
  "tree-size/count/comp": null,
  "tree-size/track/stack-main": null,
  "tree-size/track/stack-comp": null,
  "tree-size/track/intra-main": null,
  "tree-size/track/intra-comp": null,
  "tree-size/track/inter-main": null,
  "tree-size/track/inter-comp": null,
  "tree-size/track/store-main": null,
  "tree-size/track/store-comp": null,
};

export const stage_name_enum =
  /** @type {import("./stage-name").StageName[]} */ (keys(stage_name_record));

/**
 * @type {(
 *   name: string,
 * ) => name is import("./stage-name").StageName}
 */
export const isStageName = (name) => hasOwn(stage_name_record, name);
