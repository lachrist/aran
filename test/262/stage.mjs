import { loadPrecursor } from "./precursor.mjs";
import { loadTagging } from "./tagging.mjs";

const {
  Object: { hasOwn },
} = globalThis;

/**
 * @type {{ [key in import("./stage").StageName]: null }}
 */
export const STAGE_ENUM = {
  "identity": null,
  "parsing": null,
  "bare-basic-standard": null,
  "bare-basic-flexible": null,
  "bare-patch-flexible": null,
  "bare-patch-standard": null,
  "bare-weave-flexible": null,
  "bare-weave-standard": null,
  "full-basic-standard": null,
  "full-basic-flexible": null,
  "state-basic-standard": null,
};

/**
 * @type {(
 *   value: string,
 * ) => value is import("./stage").StageName}
 */
export const isStageName = (value) => hasOwn(STAGE_ENUM, value);

/**
 * @type {(
 *   name: import("./stage").StageName,
 * ) => Promise<import("./stage").ReadyStage>}
 */
export const loadStage = async (name) => {
  const stage = /** @type {{default: import("./stage").Stage}} */ (
    await import(`./stages/${name}.mjs`)
  ).default;
  return {
    setup: stage.setup,
    instrument: stage.instrument,
    listLateNegative: stage.listLateNegative,
    precursor: await loadPrecursor(stage.precursor),
    exclude: await loadTagging(stage.exclude),
    negative: await loadTagging(stage.negative),
  };
};
