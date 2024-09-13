/**
 * @type {(
 *   node: import("../../estree").Program,
 * ) => node is import("../../estree").ScriptProgram}
 */
export const isScriptProgram = (node) => node.sourceType === "script";

/**
 * @type {(
 *   node: import("../../estree").Program,
 * ) => node is import("../../estree").ModuleProgram}
 */
export const isModuleProgram = (node) => node.sourceType === "module";
