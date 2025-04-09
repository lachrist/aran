import { record as recordInner } from "./record.mjs";

/**
 * @type {(
 *   file: import("../util/file.d.ts").File,
 *   directory: null | URL,
 * ) => import("../util/file.d.ts").File}
 */
export const record = (file, directory) =>
  directory === null ? file : recordInner(file, directory);
