import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";

const {
  undefined,
  Object: { hasOwn, values: listValue },
  Array: { isArray },
  SyntaxError,
} = globalThis;

/**
 * @type {<K extends "script" | "module" | "eval">(
 *   kind: K,
 *   code: string
 * ) => (
 *   | (import("../../../../lib").EstreeProgram & {
 *     sourceType: K extends "module" ? "module" : "script"
 *   })
 *   | import("../../../../lib/source").EarlySyntaxError
 * )}
 */
export const parseGlobal = (kind, code) => {
  try {
    return /** @type {any} */ (
      parseAcorn(code, {
        ecmaVersion: "latest",
        sourceType: kind === "eval" ? "script" : kind,
        checkPrivateFields: false,
      })
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error instanceof SyntaxError
    ) {
      return {
        type: "EarlySyntaxError",
        message: error.message,
      };
    } else {
      throw error;
    }
  }
};

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => (
 *   | import("../../../../lib").EstreeScriptProgram
 *   | import("../../../../lib/source").EarlySyntaxError
 * )}
 */
export const parseAcornLocal = (_kind, code) => {
  try {
    return /** @type {any} */ (
      parseAcorn(code, {
        ecmaVersion: "latest",
        sourceType: "script",
        onInsertedSemicolon: /** @type {any} */ (undefined),
        onTrailingComma: /** @type {any} */ (undefined),
        allowReturnOutsideFunction: false,
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
        allowSuperOutsideMethod: true,
        allowHashBang: true,
        checkPrivateFields: false,
      })
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error instanceof SyntaxError
    ) {
      return {
        type: "EarlySyntaxError",
        message: error.message,
      };
    } else {
      throw error;
    }
  }
};

/**
 * @type {(
 *   node: unknown,
 * ) => import("../../../../lib").EstreeScriptProgram}
 */
const sanitizeBabel = (root) => {
  const todo = [root];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (typeof node === "object" && node !== null && hasOwn(node, "type")) {
      const cast = /**
       * @type {{
       *   type: string,
       *   name: string,
       *   id: string
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
  return /** @type {import("../../../../lib").EstreeScriptProgram} */ (root);
};

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => (
 *   | import("../../../../lib").EstreeScriptProgram
 *   | import("../../../../lib/source").EarlySyntaxError
 * )}
 */
export const parseBabelLocal = (_kind, code) => {
  try {
    return sanitizeBabel(
      parseBabel(code, {
        allowImportExportEverywhere: false,
        allowAwaitOutsideFunction: false,
        // @ts-ignore
        allowNewTargetOutsideFunction: true,
        allowReturnOutsideFunction: false,
        allowSuperOutsideMethod: true,
        allowUndeclaredExports: false,
        attachComment: false,
        // Error: The `annexB` option can only be set to `false`.
        annexB: false,
        createImportExpressions: true,
        createParenthesizedExpressions: false,
        errorRecovery: false,
        plugins: ["estree"],
        sourceType: "script",
        strictMode: false,
        ranges: false,
        tokens: false,
      }).program,
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error instanceof SyntaxError
    ) {
      return {
        type: "EarlySyntaxError",
        message: error.message,
      };
    } else {
      throw error;
    }
  }
};

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => (
 *   | import("../../../../lib").EstreeScriptProgram
 *   | import("../../../../lib/source").EarlySyntaxError
 * )}
 */
export const parseLocal = (kind, code) => {
  const root = parseAcornLocal(kind, code);
  // We prefer acorn over babel because it is faster respect the estree format.
  // The estree babel plugin is supposed to make babel produce valid estree
  //   but the private identifiers and field are still in the babel format.
  if (
    root.type === "EarlySyntaxError" &&
    root.message.startsWith("'new.target'")
  ) {
    return parseBabelLocal(kind, code);
  } else {
    return root;
  }
};
