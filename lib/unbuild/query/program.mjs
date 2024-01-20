/**
 * @type {(
 *   node: estree.Program,
 * ) => node is estree.ScriptProgram}
 */
export const isScriptProgram = (node) => node.sourceType === "script";

/**
 * @type {(
 *   node: estree.Program,
 * ) => node is estree.ModuleProgram}
 */
export const isModuleProgram = (node) => node.sourceType === "module";
