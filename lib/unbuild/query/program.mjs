/**
 * @type {(
 *   node: import("estree-sentry").Program<{}>,
 * ) => node is import("estree-sentry").ScriptProgram<{}>}
 */
export const isScriptProgram = (node) => node.sourceType === "script";

/**
 * @type {(
 *   node: import("estree-sentry").Program<{}>,
 * ) => node is import("estree-sentry").ModuleProgram<{}>}
 */
export const isModuleProgram = (node) => node.sourceType === "module";
