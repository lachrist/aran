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
  sort.situ === "local" &&
  sort.ancestry === null;

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => sort is import("./sort").ExternalLocalEvalSort}
 */
export const isExternalLocalEvalSort = (sort) =>
  sort.kind === "eval" &&
  (sort.mode === "strict" || sort.mode === "sloppy") &&
  sort.situ === "local" &&
  sort.ancestry !== null;

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

// /**
//  * @type {(
//  *   sort: import("./sort").Sort,
//  * ) => aran.Parameter[]}
//  */
// export const listSortParameter = (sort) => {
//   if (isModuleSort(sort)) {
//     if (sort.plug === "reify") {
//       return ["import.meta", "import.dynamic"];
//     } else if (sort.plug === "alien") {
//       return [
//         "import.meta",
//         "import.dynamic",
//         "read.strict",
//         "write.strict",
//         "typeof.strict",
//       ];
//     } else {
//       throw new AranTypeError(sort.plug);
//     }
//   } else if (isScriptSort(sort) || isGlobalEvalSort(sort)) {
//     if (sort.plug === "reify") {
//       return ["import.dynamic"];
//     } else if (sort.plug === "alien") {
//       if (sort.mode === "strict") {
//         return [
//           "import.dynamic",
//           "read.strict",
//           "write.strict",
//           "typeof.strict",
//         ];
//       } else if (sort.mode === "sloppy") {
//         return [
//           "import.dynamic",
//           "read.strict",
//           "write.strict",
//           "typeof.strict",
//           "read.sloppy",
//           "write.sloppy",
//           "typeof.sloppy",
//           "discard.sloppy",
//         ];
//       } else {
//         throw new AranTypeError(sort.mode);
//       }
//     } else {
//       throw new AranTypeError(sort.plug);
//     }
//   } else if (isExternalLocalEvalSort(sort)) {
//     if (sort.mode === "sloppy") {
//       return [
//         "this",
//         "import.dynamic",
//         "read.strict",
//         "write.strict",
//         "typeof.strict",
//         "read.sloppy",
//         "write.sloppy",
//         "typeof.sloppy",
//         "discard.sloppy",
//         ...removeDuplicate(sort.plug),
//       ];
//     } else if (sort.mode === "strict") {
//       return [
//         "this",
//         "import.dynamic",
//         "read.strict",
//         "write.strict",
//         "typeof.strict",
//         "private.has",
//         "private.get",
//         "private.set",
//         ...removeDuplicate(sort.plug),
//       ];
//     } else {
//       throw new AranTypeError(sort.mode);
//     }
//   } else if (isInternalLocalEvalSort(sort)) {
//     return [];
//   } else {
//     throw new AranTypeError(sort);
//   }
// };

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
