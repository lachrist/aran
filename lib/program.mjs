/**
 * @type {(
 *   program: import("./program").Program,
 * ) => program is import("./program").RootProgram}
 */
export const isRootProgram = (program) =>
  program.kind === "module" ||
  program.kind === "script" ||
  (program.kind === "eval" &&
    (program.situ === "global" || program.situ === "local.root"));

/**
 * @type {(
 *   program: import("./program").Program,
 * ) => program is import("./program").DeepProgram}
 */
export const isNodeProgram = (program) =>
  program.kind === "eval" && program.situ === "local.deep";
