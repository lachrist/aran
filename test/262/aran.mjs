import { runInContext } from "node:vm";
import { generate } from "astring";
import { generateSetup, retropile, transpile } from "../../lib/index.mjs";
import { parse as parseAcorn } from "acorn";
import { parse as parseBabel } from "@babel/parser";
import { inspectErrorMessage } from "./util/index.mjs";
import { harmonizeSyntaxError } from "./syntax-error.mjs";
import { AranTestError } from "./error.mjs";

const {
  JSON: { parse: parseJson },
  undefined,
  String,
  Reflect: { defineProperty },
  Object: { hasOwn, values: listValue },
  Array: { isArray },
} = globalThis;

export { generate };

/**
 * @type {(
 *   data: string,
 * ) => import("../../lib/trans/source").DeepLocalSitu}
 */
const parseSitu = parseJson;

/**
 * @type {(
 *   kind: "script" | "module" | "eval",
 *   code: string
 * ) => import("../../lib").LooseEstreeProgram}
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
 * ) => import("../../lib").LooseEstreeProgram}
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
 *   root: import("../../lib").LooseEstreeProgram,
 * ) => import("../../lib").LooseEstreeProgram}
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
 * ) => import("../../lib").LooseEstreeProgram}
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
 * ) => import("../../lib").LooseEstreeProgram}
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

/**
 * @type {<
 *   P extends string,
 *   H extends number | string,
 *   A extends import("../../lib").Atom & { Tag: H },
 * >(
 *   config: (
 *     & import("../../lib").TransConfig<P, H>
 *     & import("../../lib").RetroConfig
 *   ),
 *   toEvalPath: (hash: H) => P,
 * ) => {
 *   setup: (
 *     context: import("node:vm").Context,
 *   ) => {
 *     intrinsics: import("../../lib").AranIntrinsicRecord,
 *     $262: import("./test262").$262,
 *   },
 *   trans: (
 *     path: P,
 *     kind: "script" | "module" | "eval",
 *     code: string,
 *   ) => import("../../lib").AranProgram<A>,
 *   retro: (
 *     root: import("../../lib").AranProgram<
 *       import("../../lib").Atom,
 *     >,
 *   ) => string,
 * }}
 */
export const compileAran = (config, toEvalPath) => {
  const SETUP = generate(generateSetup(config));
  return {
    setup: (context) => {
      /** @type {import("../../lib").AranIntrinsicRecord} */
      const intrinsics = /** @type {any} */ (runInContext(SETUP, context));
      /** @type {import("./test262").$262} */
      const $262 = /** @type {any} */ (intrinsics["aran.global"]).$262;
      const { SyntaxError } = intrinsics["aran.global"];
      intrinsics["aran.transpileEval"] = (code, situ, hash) => {
        try {
          return transpile(
            {
              kind: "eval",
              situ: parseSitu(situ),
              path: toEvalPath(/** @type {any} */ (hash)),
              root: parseLocal("eval", code),
            },
            config,
          );
        } catch (error) {
          throw harmonizeSyntaxError(error, SyntaxError);
        }
      };
      intrinsics["aran.retropileEval"] = (root) => {
        try {
          return generate(retropile(root, config));
        } catch (error) {
          throw new AranTestError(error);
        }
      };
      return { intrinsics, $262 };
    },
    trans: (path, kind, code) =>
      transpile(
        {
          kind,
          path,
          situ: { type: "global" },
          root: parseGlobal(kind, code),
        },
        config,
      ),
    retro: (root) => generate(retropile(root, config)),
  };
};
