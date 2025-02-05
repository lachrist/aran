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
  "tree-size/count": null,
  "tree-size/inter": null,
  "tree-size/intra": null,
};

export const stage_name_enum =
  /** @type {import("./stage-name").StageName[]} */ (keys(stage_name_record));

/**
 * @type {(
 *   name: string,
 * ) => name is import("./stage-name").StageName}
 */
export const isStageName = (name) => hasOwn(stage_name_record, name);
