import { ROOT } from "../layout.mjs";
import { record as recordInner } from "./record.mjs";
import { env } from "node:process";

const { URL, Object } = globalThis;

const DIRECTORY = Object.hasOwn(env, "ARAN_RECORD")
  ? new URL(/** @type {string} */ (env.ARAN_RECORD), ROOT)
  : null;

console.log(DIRECTORY);

/**
 * @type {(
 *   file: import("../util/file").File,
 * ) => import("../util/file").File}
 */
export const record = DIRECTORY
  ? (file) => recordInner(file, DIRECTORY)
  : (file) => file;
