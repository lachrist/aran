import { runInContext } from "node:vm";
import { generateSetup, retropile, transpile } from "../../../lib/index.mjs";
import { recreateError } from "../util/index.mjs";
import { AranTestError } from "../error.mjs";
import { generate, parseGlobal, parseLocal } from "./estree.mjs";

const {
  JSON: { parse: parseJson },
} = globalThis;

/**
 * @type {(
 *   data: string,
 * ) => import("../../../lib/trans/source").DeepLocalSitu}
 */
const parseSitu = parseJson;

/**
 * @type {<
 *   P extends string,
 *   H extends number | string,
 *   A extends import("../../../lib").Atom & { Tag: H },
 * >(
 *   config: (
 *     & import("../../../lib").TransConfig<P, H>
 *     & import("../../../lib").RetroConfig
 *   ),
 *   toEvalPath: (hash: H) => P,
 * ) => {
 *   setup: (
 *     context: import("node:vm").Context,
 *   ) => {
 *     intrinsics: import("../../../lib").AranIntrinsicRecord,
 *     $262: import("../$262").$262,
 *   },
 *   trans: (
 *     path: P,
 *     kind: "script" | "module" | "eval",
 *     code: string,
 *   ) => import("../../../lib").AranProgram<A>,
 *   retro: (
 *     root: import("../../../lib").AranProgram<
 *       import("../../../lib").Atom,
 *     >,
 *   ) => string,
 * }}
 */
export const compileAran = (config, toEvalPath) => {
  const SETUP = generate(generateSetup(config));
  return {
    setup: (context) => {
      /** @type {import("../../../lib").AranIntrinsicRecord} */
      const intrinsics = /** @type {any} */ (runInContext(SETUP, context));
      /** @type {import("../$262").$262} */
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
          throw recreateError(error, {
            SyntaxError,
            AranSyntaxError: SyntaxError,
          });
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
