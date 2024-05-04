/**
 * @type {<B>(
 *   program: import("./program").Program<B>,
 * ) => program is import("./program").RootProgram<B>}
 */
export const isRootProgram = (program) =>
  program.kind === "module" ||
  program.kind === "script" ||
  (program.kind === "eval" &&
    (program.situ === "global" || program.situ === "local.root"));

/**
 * @type {<B>(
 *   program: import("./program").Program<B>,
 * ) => program is import("./program").NodeProgram<B>}
 */
export const isNodeProgram = (program) =>
  program.kind === "eval" && program.situ === "local.deep";
