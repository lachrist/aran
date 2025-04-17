import { serialize as serializeInner } from "../symbolic-intensional/record.mjs";
export { compileFileRecord } from "../symbolic-intensional/record.mjs";

/**
 * @type {(
 *   value: import("./record.d.ts").Value,
 * ) => import("./record.d.ts").Serial}
 */
export const serialize = /** @type {any} */ (serializeInner);
