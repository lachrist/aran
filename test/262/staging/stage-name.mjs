const {
  Object: { keys, hasOwn },
} = globalThis;

/** @type {{[key in import("./stage-name.d.ts").StageName]: null}} */
export const stage_name_record = {
  "bare-comp": null,
  "bare-main": null,
  "count-branch": null,
  "flex-full": null,
  "flex-void": null,
  "identity": null,
  "invariant": null,
  "parsing-main": null,
  "parsing-comp": null,
  "stnd-full": null,
  "stnd-void": null,
  "trace": null,
  "track-origin": null,
  "linvail/cust-main": null,
  "linvail/cust-comp": null,
  "linvail/stnd-main": null,
  "linvail/stnd-comp": null,
  "provenancy/count/main": null,
  "provenancy/count/comp": null,
  "provenancy/track/stack-main": null,
  "provenancy/track/stack-comp": null,
  "provenancy/track/intra-main": null,
  "provenancy/track/intra-comp": null,
  "provenancy/track/inter-main": null,
  "provenancy/track/inter-comp": null,
  "provenancy/track/store-main": null,
  "provenancy/track/store-comp-internal": null,
  "provenancy/track/store-comp-external": null,
};

export const stage_name_enum =
  /** @type {import("./stage-name.d.ts").StageName[]} */ (
    keys(stage_name_record)
  );

/**
 * @type {(
 *   name: string,
 * ) => name is import("./stage-name.d.ts").StageName}
 */
export const isStageName = (name) => hasOwn(stage_name_record, name);
