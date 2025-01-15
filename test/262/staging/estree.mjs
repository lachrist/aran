export { generate } from "astring";
import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";
import { inspectErrorMessage } from "../util/index.mjs";

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
 * ) => import("../../../lib").LooseEstreeProgram}
 */
export const parseGlobal = (kind, code) =>
  parseAcorn(code, {
    ecmaVersion: "latest",
    sourceType: kind === "eval" ? "script" : kind,
    checkPrivateFields: false,
  });

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => import("../../../lib").LooseEstreeProgram}
 */
const parseAcornLocal = (_kind, code) =>
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
  });

/**
 * @type {(
 *   root: import("../../../lib").LooseEstreeProgram,
 * ) => import("../../../lib").LooseEstreeProgram}
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
 * ) => import("../../../lib").LooseEstreeProgram}
 */
const parseBabelLocal = (_kind, code) =>
  sanitizeBabel(
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

/**
 * @type {(
 *   kind: "eval",
 *   code: string,
 * ) => import("../../../lib").LooseEstreeProgram}
 */
export const parseLocal = (kind, code) => {
  // We prefer acorn over babel because it is faster respect the estree format.
  // The estree babel plugin is supposed to make babel produce valid estree
  //   but the private identifiers and field are still in the babel format.
  try {
    return parseAcornLocal(kind, code);
  } catch (error) {
    if (inspectErrorMessage(error).startsWith("'new.target'")) {
      return parseBabelLocal(kind, code);
    } else {
      throw error;
    }
  }
};
