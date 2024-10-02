import { parse } from "acorn";
import { guardModuleProgram, guardScriptProgram } from "estree-sentry";

/**
 * @type {(
 *   code: string,
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
export const parseScript = (code) =>
  guardScriptProgram(parse(code, { ecmaVersion: 2024, sourceType: "script" }));

/**
 * @type {(
 *  code: string,
 * ) => import("estree-sentry").ModuleProgram<{}>}
 */
export const parseModule = (code) =>
  guardModuleProgram(parse(code, { ecmaVersion: 2024, sourceType: "module" }));
