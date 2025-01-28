import { STAGE_ENUM } from "./stage-name.mjs";

const {
  Object: { hasOwn },
} = globalThis;

/**
 * @type {(
 *   name: string,
 * ) => name is import("./stage-name").StageName}
 */
export const isStageName = (name) => hasOwn(STAGE_ENUM, name);
