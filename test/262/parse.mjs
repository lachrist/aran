import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";

const {
  Object: { hasOwn, values: listValue },
  Array: { isArray },
  SyntaxError,
} = globalThis;

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
 * @type {(
 *   node: unknown,
 * ) => estree.ScriptProgram}
 */
const _sanitizeBabel = (root) => {
  const todo = [root];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (typeof node === "object" && node !== null && hasOwn(node, "type")) {
      const cast = /**
       * @type {{
       * type: string,
       * name: string,
       * id: string
       * }}
       */ (node);
      if (cast.type === "PrivateName") {
        cast.type = "PrivateIdentifier";
        cast.name = cast.id;
      }
      for (const child of listValue(node)) {
        todo[length] = child;
        length += 1;
      }
    } else if (isArray(node)) {
      for (const child of node) {
        todo[length] = child;
        length += 1;
      }
    } else {
      // noop
    }
  }
  return /** @type {estree.ScriptProgram} */ (root);
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
        root: /** @type {any} */ (
          parseAcorn(code, {
            ecmaVersion: "latest",
            sourceType: "script",
            onInsertedSemicolon: undefined,
            onTrailingComma: undefined,
            allowReturnOutsideFunction: false,
            allowImportExportEverywhere: true,
            allowAwaitOutsideFunction: true,
            allowSuperOutsideMethod: true,
            allowHashBang: true,
            checkPrivateFields: false,
          })
        ),
        base,
        context,
      },
    };
    // return {
    //   type: "success",
    //   data: {
    //     kind: "eval",
    //     root: sanitizeBabel(
    //       parseBabel(code, {
    //         allowImportExportEverywhere: false,
    //         allowAwaitOutsideFunction: false,
    //         // @ts-ignore
    //         allowNewTargetOutsideFunction: true,
    //         allowReturnOutsideFunction: false,
    //         allowSuperOutsideMethod: true,
    //         allowUndeclaredExports: false,
    //         attachComment: false,
    //         // Error: The `annexB` option can only be set to `false`.
    //         annexB: false,
    //         createImportExpressions: true,
    //         createParenthesizedExpressions: false,
    //         errorRecovery: false,
    //         plugins: ["estree"],
    //         sourceType: "script",
    //         strictMode: false,
    //         ranges: false,
    //         tokens: false,
    //       }).program,
    //     ),
    //     base,
    //     context,
    //   },
    // };
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
