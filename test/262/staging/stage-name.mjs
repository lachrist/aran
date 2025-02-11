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
  "linvail": null,
  "linvail-standard": null,
  "tree-size/count/stage": null,
  "tree-size/basic/stage-inter": null,
  "tree-size/basic/stage-intra": null,
  "tree-size/linvail/stage": null,
};

export const stage_name_enum =
  /** @type {import("./stage-name").StageName[]} */ (keys(stage_name_record));

/**
 * @type {(
 *   name: string,
 * ) => name is import("./stage-name").StageName}
 */
export const isStageName = (name) => hasOwn(stage_name_record, name);
