import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";
import { inspectErrorName, serializeError } from "../error-serial.mjs";

const {
  undefined,
  String,
  Reflect: { defineProperty },
  Object: { hasOwn, values: listValue },
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   kind: "script" | "module" | "eval",
 *   code: string
 * ) => import("../outcome").Outcome<
 *   import("../../../").LooseEstreeProgram,
 *   import("../error-serial").ErrorSerial
 * >}
 */
export const parseGlobal = (kind, code) => {
  try {
    return {
      type: "success",
      data: parseAcorn(code, {
        ecmaVersion: "latest",
        sourceType: kind === "eval" ? "script" : kind,
        checkPrivateFields: false,
      }),
    };
  } catch (error) {
    if (inspectErrorName(error) === "SyntaxError") {
      return {
        type: "failure",
        data: serializeError(error),
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
 * ) => import("../outcome").Outcome<
 *   import("../../../").LooseEstreeProgram,
 *   import("../error-serial").ErrorSerial
 * >}
 */
const parseAcornLocal = (_kind, code) => {
  try {
    return {
      type: "success",
      data: parseAcorn(code, {
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
      }),
    };
  } catch (error) {
    if (inspectErrorName(error) === "SyntaxError") {
      return {
        type: "failure",
        data: serializeError(error),
      };
    } else {
      throw error;
    }
  }
};

/**
 * @type {(
 *   root: import("../../../").LooseEstreeProgram,
 * ) => import("../../../").LooseEstreeProgram}
 */
const sanitizeBabel = (root) => {
  /** @type {object[]} */
  const todo = [root];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (isArray(node)) {
      for (const child of node) {
        todo[length] = child;
        length += 1;
      }
    } else {
      if (
        hasOwn(node, "type") &&
        "type" in node &&
        node.type === "PrivateName" &&
        "id" in node
      ) {
        node.type = "PrivateIdentifier";
        defineProperty(node, "name", {
          // @ts-ignore
          __proto__: null,
          value: String(node.id),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      for (const child of listValue(node)) {
        if (child != null && typeof child === "object") {
          todo[length] = child;
          length += 1;
        }
      }
    }
  }
  return root;
};

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => import("../outcome").Outcome<
 *   import("../../../").LooseEstreeProgram,
 *   import("../error-serial").ErrorSerial
 * >}
 */
const parseBabelLocal = (_kind, code) => {
  try {
    return {
      type: "success",
      data: sanitizeBabel(
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
    };
  } catch (error) {
    if (inspectErrorName(error) === "SyntaxError") {
      return {
        type: "failure",
        data: serializeError(error),
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
 * ) => import("../outcome").Outcome<
 *   import("../../../").LooseEstreeProgram,
 *   import("../error-serial").ErrorSerial
 * >}
 */
export const parseLocal = (kind, code) => {
  const outcome = parseAcornLocal(kind, code);
  // We prefer acorn over babel because it is faster respect the estree format.
  // The estree babel plugin is supposed to make babel produce valid estree
  //   but the private identifiers and field are still in the babel format.
  if (
    outcome.type === "failure" &&
    outcome.data.message.startsWith("'new.target'")
  ) {
    return parseBabelLocal(kind, code);
  } else {
    return outcome;
  }
};
