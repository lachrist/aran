import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";

const {
  undefined,
  Object: { hasOwn, values: listValue },
  Array: { isArray },
  SyntaxError,
} = globalThis;

/**
 * @type {<B>(
 *   code: string,
 *   base: B,
 *   kind: "script" | "module" | "eval",
 * ) => (
 *   | import("../../../../lib/program").ScriptProgram<B>
 *   | import("../../../../lib/program").ModuleProgram<B>
 *   | import("../../../../lib/program").GlobalEvalProgram<B>
 * )}
 */
const parseGlobal = (code, base, kind) => {
  try {
    return {
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
        kind,
        root: {
          type: "EarlySyntaxError",
          message: error.message,
        },
        base,
        context: {
          type: "global",
        },
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
 *   context: import("../../../../lib/context").InternalLocalContext,
 * ) => import("../../../../lib/program").DeepLocalEvalProgram<B>}
 */
export const parseAcornLocal = (code, base, context) => {
  try {
    return {
      kind: "eval",
      root: /** @type {any} */ (
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
      ),
      base,
      context,
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
        kind: "eval",
        root: {
          type: "EarlySyntaxError",
          message: error.message,
        },
        base,
        context,
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
const sanitizeBabel = (root) => {
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
 *   context: import("../../../../lib/context").InternalLocalContext,
 * ) => import("../../../../lib/program").DeepLocalEvalProgram<B>}
 */
export const parseBabelLocal = (code, base, context) => {
  try {
    return {
      kind: "eval",
      root: sanitizeBabel(
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
      ),
      base,
      context,
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
        kind: "eval",
        root: {
          type: "EarlySyntaxError",
          message: error.message,
        },
        base,
        context,
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
 *   context: import("../../../../lib/context").InternalLocalContext,
 * ) => import("../../../../lib/program").DeepLocalEvalProgram<B>}
 */
const parseLocal = (code, base, context) => {
  const acorn = parseAcornLocal(code, base, context);
  // We prefer acorn over babel because it is faster respect the estree format.
  // The estree babel plugin is supposed to make babel produce valid estree
  //   but the private identifiers and field are still in the babel format.
  if (
    acorn.root.type === "EarlySyntaxError" &&
    acorn.root.message.startsWith("'new.target'")
  ) {
    return parseBabelLocal(code, base, context);
  } else {
    return acorn;
  }
};

/**
 * @type {<B>(
 *   code: string,
 *   base: B,
 *   situ: import("./situ").Situ,
 * ) => import("../../../../lib/program").Program<B>}
 */
export const parse = (code, base, situ) => {
  if (situ.context === null) {
    return parseGlobal(code, base, situ.kind);
  } else {
    return parseLocal(code, base, situ.context);
  }
};
