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
 *   path extends string,
 *   hash extends number | string,
 * >(
 *   config: (
 *     & import("aran").TransConfig<hash, path>
 *     & import("aran").RetroConfig
 *   ),
 *   toEvalPath: (hash: hash) => path,
 * ) => {
 *   setup: (
 *     context: import("node:vm").Context,
 *   ) => {
 *     intrinsics: import("aran").AranIntrinsicRecord,
 *     $262: import("../$262").$262,
 *   },
 *   trans: <atom extends import("aran").Atom & { Tag: hash }>(
 *     path: path,
 *     kind: "script" | "module" | "eval",
 *     code: string,
 *   ) => import("aran").AranProgram<atom>,
 *   retro: (
 *     root: import("aran").AranProgram<import("aran").Atom>,
 *   ) => string,
 * }}
 */
export const compileAran = (config, toEvalPath) => {
  const SETUP = generate(generateSetup(config));
  return {
    setup: (context) => {
      /** @type {import("aran").AranIntrinsicRecord} */
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
          // const code = generate(retropile(root, config));
          // console.log(code);
          // return code;
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
