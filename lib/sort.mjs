import { isModuleHeader } from "./header.mjs";

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").ModuleSort}
 */
export const isModuleSort = (sort) =>
  sort.kind === "module" && sort.mode === "strict" && sort.situ === "global";

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").ScriptSort}
 */
export const isScriptSort = (sort) =>
  sort.kind === "script" &&
  (sort.mode === "strict" || sort.mode === "sloppy") &&
  sort.situ === "global";

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").GlobalEvalSort}
 */
export const isGlobalEvalSort = (sort) =>
  sort.kind === "eval" &&
  (sort.mode === "strict" || sort.mode === "sloppy") &&
  sort.situ === "global";

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").InternalLocalEvalSort}
 */
export const isInternalLocalEvalSort = (sort) =>
  sort.kind === "eval" &&
  (sort.mode === "strict" || sort.mode === "sloppy") &&
  sort.situ === "local";

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").ExternalLocalEvalSort}
 */
export const isExternalLocalEvalSort = (sort) =>
  sort.kind === "eval" &&
  (sort.mode === "strict" || sort.mode === "sloppy") &&
  (sort.situ === "program" ||
    sort.situ === "function" ||
    sort.situ === "method" ||
    sort.situ === "constructor" ||
    sort.situ === "derived-constructor");

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").RootSort}
 */
export const isRootSort = (sort) =>
  isModuleSort(sort) ||
  isScriptSort(sort) ||
  isGlobalEvalSort(sort) ||
  isExternalLocalEvalSort(sort);

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").RootSort}
 */
export const isNodeSort = (sort) => isInternalLocalEvalSort(sort);

/**
 * @type {(
 *   header: import("./header").Header,
 *   sort: import("./sort").Sort,
 * ) => boolean}
 */
export const isHeaderCompatible = (header, sort) => {
  if (header.mode === "sloppy" && sort.mode === "strict") {
    return false;
  }
  if (isModuleHeader(header) && !isModuleSort(sort)) {
    return false;
  }
  // TODO: Check for other incompatibilities.
  return true;
};
