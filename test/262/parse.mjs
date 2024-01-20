import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";

const { SyntaxError } = globalThis;

/**
 * @type {<B>(
 *   code: string,
 *   base: B,
 *   kind: "script" | "module" | "eval",
 * ) => import("./outcome").Outcome<
 *   (
 *     | import("../../lib/program").ScriptProgram<B>
 *     | import("../../lib/program").ModuleProgram<B>
 *     | import("../../lib/program").GlobalEvalProgram<B>
 *   ),
 *   string
 * >}
 */
export const parseGlobal = (code, base, kind) => {
  try {
    return {
      type: "success",
      data: {
        kind,
        root: /** @type {any} */ (
          parseAcorn(code, {
            ecmaVersion: "latest",
            sourceType: kind === "module" ? "module" : "script",
            checkPrivateFields: false,
          })
        ),
        base,
        context: {
          type: "global",
        },
      },
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error instanceof SyntaxError
    ) {
      return {
        type: "failure",
        data: error.message,
      };
    } else {
      throw error;
    }
  }
};

/**
 * @type {<B>(
 *   code: string,
 *   base: B,
 *   context: import("../../lib/context").InternalLocalContext,
 * ) => import("./outcome").Outcome<
 *   import("../../lib/program").InternalLocalEvalProgram<B>,
 *   string
 * >}
 */
export const parseLocal = (code, base, context) => {
  try {
    return {
      type: "success",
      data: {
        kind: "eval",
        root: /** @type {estree.ScriptProgram} */ (
          /** @type {unknown} */ (
            parseBabel(code, {
              allowImportExportEverywhere: false,
              allowAwaitOutsideFunction: false,
              // @ts-ignore
              allowNewTargetOutsideFunction: true,
              allowReturnOutsideFunction: false,
              allowSuperOutsideMethod: true,
              allowUndeclaredExports: false,
              attachComment: false,
              annexB: true,
              createImportExpressions: false,
              createParenthesizedExpressions: false,
              errorRecovery: false,
              plugins: ["estree"],
              sourceType: "script",
              strictMode: false,
              ranges: false,
              tokens: false,
            }).program
          )
        ),
        base,
        context,
      },
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error instanceof SyntaxError
    ) {
      return {
        type: "failure",
        data: error.message,
      };
    } else {
      throw error;
    }
  }
};
