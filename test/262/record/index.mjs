import { record as recordInner } from "./record.mjs";

/**
 * @type {(
 *   file: import("../util/file").File,
 *   directory: null | URL,
 * ) => import("../util/file").File}
 */
export const record = (file, directory) =>
  directory === null ? file : recordInner(file, directory);
