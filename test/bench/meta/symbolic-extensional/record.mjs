export { compileFileRecord } from "../symbolic-intensional/record.mjs";
import { serialize as serializeInner } from "./record.mjs";

/**
 * @type {(
 *   value: import("./record.d.ts").Value,
 * ) => import("./record.d.ts").Serial}
 */
export const serialize = serializeInner;
