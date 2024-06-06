/**
 * @type {(
 *   program: import("./source").Source,
 * ) => program is import("./source").RootSource}
 */
export const isRootSource = (program) =>
  program.kind === "module" ||
  program.kind === "script" ||
  (program.kind === "eval" &&
    (program.situ === "global" || program.situ === "local.root"));

/**
 * @type {(
 *   program: import("./source").Source,
 * ) => program is import("./source").DeepSource}
 */
export const isNodeSource = (program) =>
  program.kind === "eval" && program.situ === "local.deep";
