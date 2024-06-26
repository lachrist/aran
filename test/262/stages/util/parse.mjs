import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";
import { AranTypeError } from "../../error.mjs";

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
 *   | (estree.Program & {
 *     sourceType: K extends "module" ? "module" : "script"
 *   })
 *   | import("../../../../lib/program").EarlySyntaxError
 * )}
 */
const parseGlobal = (kind, code) => {
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
 *   | (estree.Program & { sourceType: "script" })
 *   | import("../../../../lib/program").EarlySyntaxError
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
 * ) => estree.Program & { sourceType: "script" }}
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
  return /** @type {estree.ScriptProgram} */ (root);
};

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => (
 *   | (estree.Program & { sourceType: "script" })
 *   | import("../../../../lib/program").EarlySyntaxError
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
 *   | (estree.Program & { sourceType: "script" })
 *   | import("../../../../lib/program").EarlySyntaxError
 * )}
 */
const parseLocal = (kind, code) => {
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

/**
 * @type {<B>(
 *   program: import("./parse").RawProgram<B>,
 * ) => import("../../../../lib/program").Program<B>}
 */
export const parse = ({ code, ...program }) => {
  if (program.situ === "global") {
    if (program.kind === "module") {
      return {
        ...program,
        root: parseGlobal(program.kind, code),
      };
    } else if (program.kind === "script" || program.kind === "eval") {
      return {
        ...program,
        root: parseGlobal(program.kind, code),
      };
    } else {
      throw new AranTypeError(program);
    }
  } else if (program.situ === "local.deep" || program.situ === "local.root") {
    return {
      ...program,
      root: parseLocal(program.kind, code),
    };
  } else {
    throw new AranTypeError(program);
  }
};
